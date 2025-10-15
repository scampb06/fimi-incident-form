// INTEGRATION INSTRUCTIONS:
// Copy this endpoint code and paste it into your Program.cs file alongside your existing endpoints
// This endpoint uses your existing helper functions: ExtractSpreadsheetInfo() and GetServiceAccountAccessToken()

app.MapGet("/google-sheets/check-permissions", async (HttpContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration) =>
{
    try
    {
        var url = context.Request.Query["url"];
        
        if (string.IsNullOrEmpty(url))
        {
            return Results.BadRequest(new { 
                hasPermission = false,
                message = "URL parameter is required" 
            });
        }

        // Extract spreadsheet ID and GID from Google Sheets URL
        var (spreadsheetId, gid) = ExtractSpreadsheetInfo(url!);
        
        if (string.IsNullOrEmpty(spreadsheetId))
        {
            return Results.BadRequest(new { 
                hasPermission = false,
                message = "Invalid Google Sheets URL. Expected format: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit#gid={SHEET_ID}",
                providedUrl = url.ToString()
            });
        }
        
        // Get service account configuration
        var serviceAccountSection = configuration.GetSection("GoogleSheets:ServiceAccount");
        var clientEmail = serviceAccountSection["client_email"];
        var privateKey = serviceAccountSection["private_key"];
        var tokenUri = serviceAccountSection["token_uri"];

        if (string.IsNullOrEmpty(clientEmail) || string.IsNullOrEmpty(privateKey) || string.IsNullOrEmpty(tokenUri))
        {
            return Results.BadRequest(new { 
                hasPermission = false,
                message = "Service account configuration is missing" 
            });
        }

        var httpClient = httpClientFactory.CreateClient();
        
        // Use your existing GetServiceAccountAccessToken method with read-only permissions
        var accessToken = await GetServiceAccountAccessToken(httpClient, clientEmail, privateKey, tokenUri);
        
        if (string.IsNullOrEmpty(accessToken))
        {
            return Results.Json(new { 
                hasPermission = false,
                message = "Failed to authenticate with Google Sheets API",
                error = "authentication_failed"
            }, statusCode: 401);
        }

        httpClient.DefaultRequestHeaders.Clear();
        httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");

        // Try to get the spreadsheet metadata - this is a lightweight way to check permissions
        var metadataUrl = $"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}";
        var metadataResponse = await httpClient.GetAsync(metadataUrl);
        
        if (metadataResponse.IsSuccessStatusCode)
        {
            // If we can read metadata, we have at least viewer permission
            // Let's also try to read a small amount of data to confirm read access
            try
            {
                var metadataContent = await metadataResponse.Content.ReadAsStringAsync();
                var metadataDoc = JsonDocument.Parse(metadataContent);
                
                // Find the correct sheet name using the same logic as your other endpoints
                string sheetName = "Sheet1"; // Default fallback
                var sheets = metadataDoc.RootElement.GetProperty("sheets").EnumerateArray();
                
                foreach (var sheet in sheets)
                {
                    var properties = sheet.GetProperty("properties");
                    var sheetId = properties.GetProperty("sheetId").GetInt32();
                    var title = properties.GetProperty("title").GetString() ?? "Sheet1";
                    
                    if (gid.HasValue && sheetId == gid.Value)
                    {
                        sheetName = title;
                        break;
                    }
                    else if (!gid.HasValue && sheet.Equals(sheets.First()))
                    {
                        // Use first sheet if no GID specified
                        sheetName = title;
                        break;
                    }
                }

                // Try to read just the header row to verify read permissions
                var testReadUrl = $"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{Uri.EscapeDataString(sheetName)}!A1:Z1";
                var testReadResponse = await httpClient.GetAsync(testReadUrl);
                
                if (testReadResponse.IsSuccessStatusCode)
                {
                    return Results.Ok(new { 
                        hasPermission = true,
                        message = "Service account has read access to the Google Sheet",
                        spreadsheetId = spreadsheetId,
                        sheetName = sheetName,
                        permissions = "read_confirmed",
                        serviceAccountEmail = clientEmail,
                        sourceUrl = url.ToString()
                    });
                }
                else
                {
                    // Can read metadata but not sheet data - unusual case
                    return Results.Json(new { 
                        hasPermission = false,
                        message = "Service account can access spreadsheet metadata but cannot read sheet data",
                        error = "partial_access",
                        statusCode = (int)testReadResponse.StatusCode
                    }, statusCode: 403);
                }
            }
            catch (Exception ex)
            {
                return Results.Json(new { 
                    hasPermission = false,
                    message = $"Error verifying sheet access: {ex.Message}",
                    error = "verification_failed"
                }, statusCode: 500);
            }
        }
        else if (metadataResponse.StatusCode == System.Net.HttpStatusCode.Forbidden)
        {
            // 403 means we don't have permission to access this spreadsheet
            return Results.Json(new { 
                hasPermission = false,
                message = "Service account does not have permission to access this Google Sheet. Please share the sheet with the service account email.",
                error = "insufficient_permissions",
                serviceAccountEmail = clientEmail,
                spreadsheetId = spreadsheetId,
                sourceUrl = url.ToString()
            }, statusCode: 403);
        }
        else if (metadataResponse.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            // 404 means the spreadsheet doesn't exist or URL is invalid
            return Results.Json(new { 
                hasPermission = false,
                message = "Google Sheet not found. Please check that the URL is correct and the sheet exists.",
                error = "spreadsheet_not_found",
                spreadsheetId = spreadsheetId,
                sourceUrl = url.ToString()
            }, statusCode: 404);
        }
        else
        {
            // Other error
            var errorContent = await metadataResponse.Content.ReadAsStringAsync();
            return Results.Json(new { 
                hasPermission = false,
                message = $"Google Sheets API error: {errorContent}",
                error = "api_error",
                statusCode = (int)metadataResponse.StatusCode
            }, statusCode: (int)metadataResponse.StatusCode);
        }
    }
    catch (Exception ex)
    {
        return Results.Json(new { 
            hasPermission = false,
            message = $"Error checking permissions: {ex.Message}",
            error = "internal_error"
        }, statusCode: 500);
    }
});