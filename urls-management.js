/**
 * URLs Management Module
 * Handles UI updates and management of URLs from Google Sheets or manual entry
 * Supports both Trusted URLs and Malicious URLs with Platform field
 */

// Global arrays to store URLs data
let urlsList = [];
let maliciousUrlsList = [];

// URL Type Configuration
const URL_TYPES = {
    trusted: {
        listVar: 'urlsList',
        containerId: 'urls-container',
        messageId: 'urls-message',
        googleSheetsUrlId: 'googleSheetsUrl',
        googleSheetsErrorId: 'googleSheetsUrlError',
        fields: ['url', 'domain', 'archiveUrl'],
        fieldLabels: ['URL:', 'Domain:', 'Archive URL:'],
        fieldPlaceholders: ['https://example.com', 'example.com', 'https://archive.org/...'],
        backgroundColor: '#f9f9f9',
        googleSheetsBackgroundColor: '#e3f2fd',
        borderColor: '#ddd',
        googleSheetsBorderColor: '#90caf9'
    },
    malicious: {
        listVar: 'maliciousUrlsList',
        containerId: 'malicious-urls-container',
        messageId: 'malicious-urls-message',
        googleSheetsUrlId: 'maliciousGoogleSheetsUrl',
        googleSheetsErrorId: 'maliciousGoogleSheetsUrlError',
        fields: ['url', 'channel', 'archiveUrl'],
        fieldLabels: ['URL:', 'Channel:', 'Archive URL:'],
        fieldPlaceholders: ['https://example.com', 'Twitter/X, Facebook, etc.', 'https://archive.org/...'],
        backgroundColor: '#fff2f2',
        googleSheetsBackgroundColor: '#ffebee',
        borderColor: '#ffcdd2',
        googleSheetsBorderColor: '#ef5350'
    }
};

// Get the array reference for a URL type
function getUrlsArray(urlType) {
    return urlType === 'trusted' ? urlsList : maliciousUrlsList;
}

// Set the array for a URL type
function setUrlsArray(urlType, array) {
    if (urlType === 'trusted') {
        urlsList = array;
    } else {
        maliciousUrlsList = array;
    }
}

// Function to validate Google Sheets URL
function validateGoogleSheetsUrl(url) {
    if (!url || url.trim() === '') {
        return { valid: false, message: 'Please enter a Google Sheets URL' };
    }
    
    // Check if it's a valid URL format
    try {
        new URL(url);
    } catch (e) {
        return { valid: false, message: 'Please enter a valid URL' };
    }
    
    // Check if it's a Google Sheets URL
    if (!url.includes('docs.google.com/spreadsheets')) {
        return { valid: false, message: 'Please enter a valid Google Sheets URL (must contain docs.google.com/spreadsheets)' };
    }
    
    return { valid: true, message: '' };
}

// Function to show validation error for Google Sheets URL
function showGoogleSheetsUrlError(message, urlType = 'trusted') {
    const config = URL_TYPES[urlType];
    const errorDiv = document.getElementById(config.googleSheetsErrorId);
    const urlInput = document.getElementById(config.googleSheetsUrlId);
    
    if (errorDiv && urlInput) {
        errorDiv.textContent = message;
        errorDiv.style.display = message ? 'block' : 'none';
        urlInput.style.borderColor = message ? '#dc3545' : '#ddd';
    }
}

// Function to clear validation error for Google Sheets URL
function clearGoogleSheetsUrlError(urlType = 'trusted') {
    showGoogleSheetsUrlError('', urlType);
}

// Function to load URLs from Google Sheets (generic)
async function loadUrlsFromGoogleSheetsGeneric(urlType = 'trusted') {
    const config = URL_TYPES[urlType];
    const urlInput = document.getElementById(config.googleSheetsUrlId);
    if (!urlInput) {
        alert('Google Sheets URL input field not found');
        return;
    }
    
    const googleSheetsUrl = urlInput.value.trim();
    
    // Validate the URL
    const validation = validateGoogleSheetsUrl(googleSheetsUrl);
    if (!validation.valid) {
        showGoogleSheetsUrlError(validation.message, urlType);
        urlInput.focus();
        return;
    }
    
    // Clear any previous validation errors
    clearGoogleSheetsUrlError(urlType);
    
    // Open the interim editing window with the user-provided URL
    openGoogleSheetsEditingWindow(googleSheetsUrl, urlType);
}

// Function for trusted URLs (backwards compatibility)
async function loadUrlsFromGoogleSheets() {
    return loadUrlsFromGoogleSheetsGeneric('trusted');
}

// Function for malicious URLs
async function loadMaliciousUrlsFromGoogleSheets() {
    return loadUrlsFromGoogleSheetsGeneric('malicious');
}

// Function to open the Google Sheets editing window
function openGoogleSheetsEditingWindow(userProvidedUrl, urlType = 'trusted') {
    const config = URL_TYPES[urlType];
    const windowTitle = urlType === 'trusted' ? 'Add Trusted URLs' : 'Add Malicious URLs';
    const sectionTitle = urlType === 'trusted' ? 'Add Trusted URLs' : 'Add Malicious URLs';
    
    // Dynamic instructions based on URL type
    let instructions, extractButtonText, extractFunction;
    if (urlType === 'malicious') {
        instructions = 'Add URLs below under the column heading "URL". Press Done when you are finished.';
        extractButtonText = 'Extract unspecified channels';
        extractFunction = 'extractUnspecifiedChannels';
    } else {
        instructions = 'Add URLs below under the column heading "URL". Press Done when you are finished.';
        extractButtonText = 'Extract unspecified domains';
        extractFunction = 'extractUnspecifiedDomains';
    }
    
    // Create the popup window similar to DISARM Framework
    const popup = window.open('', 'googleSheetsEditor', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    popup.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${windowTitle}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #ddd;
                }
                .title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                    margin: 0;
                }
                .done-button {
                    background: #007cba;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: background-color 0.2s;
                    white-space: nowrap;
                }
                .done-button:hover {
                    background: #005a8a;
                }
                .done-button:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                }
                .instructions {
                    font-size: 16px;
                    color: #666;
                    margin-bottom: 20px;
                    line-height: 1.4;
                }
                .google-sheets-container {
                    width: 100%;
                    height: calc(100vh - 150px);
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    background: white;
                }
                .google-sheets-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                    border-radius: 4px;
                }
                .loading-message {
                    text-align: center;
                    padding: 40px;
                    font-size: 18px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="title">${sectionTitle}</h1>
                <div style="display: flex; gap: 10px;">
                    <button class="done-button" onclick="${extractFunction}()" style="background: #28a745;">${extractButtonText}</button>
                    <button class="done-button" onclick="archiveUnarchiveUrls()" style="background: #28a745;">Archive unarchived URLs</button>
                    <button class="done-button" onclick="handleDoneClick()">Done</button>
                </div>
            </div>
            
            <div class="instructions">
                ${instructions}
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; display: flex; align-items: center; gap: 15px; flex-wrap: nowrap;">
                    <label id="preValidationLabel" style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-weight: bold; white-space: nowrap;">
                        <input type="checkbox" id="preValidationCheckbox" style="cursor: pointer; width: 16px; height: 16px;">
                        Prevalidation
                    </label>
                    <span style="color: #999; font-size: 20px;">|</span>
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-weight: bold; white-space: nowrap;">
                        <input type="radio" id="waybackMachineRadio" name="archiveService" value="wayback" checked style="cursor: pointer; width: 16px; height: 16px;">
                        Wayback Machine
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-weight: bold; white-space: nowrap;">
                        <input type="radio" id="bellingcatRadio" name="archiveService" value="bellingcat" style="cursor: pointer; width: 16px; height: 16px;">
                        Bellingcat Auto Archiver
                    </label>
                </div>
            </div>
            
                    <div class="google-sheets-container">
                <div class="loading-message" id="loadingMessage">
                    Loading Google Sheets editor...
                </div>
                <iframe id="googleSheetsFrame" class="google-sheets-iframe" style="display: none;"></iframe>
            </div>            <script>
                // Use window property to avoid redeclaration issues
                window.userGoogleSheetsUrl = '${userProvidedUrl}';
                
                // Load the Google Sheets editing URL
                function loadGoogleSheetsEditor() {
                    try {
                        console.log('Loading user-provided Google Sheets URL:', window.userGoogleSheetsUrl);
                        
                        const iframe = document.getElementById('googleSheetsFrame');
                        const loadingMessage = document.getElementById('loadingMessage');
                        
                        iframe.src = window.userGoogleSheetsUrl;
                        iframe.style.display = 'block';
                        loadingMessage.style.display = 'none';
                        
                        // Add iframe load event listener to detect issues
                        iframe.onload = function() {
                            console.log('Iframe loaded successfully');
                        };
                        
                        iframe.onerror = function() {
                            console.error('Iframe failed to load');
                            document.getElementById('loadingMessage').innerHTML = 
                                'Failed to load Google Sheets. The URL may not allow iframe embedding or may be incorrect.';
                            document.getElementById('loadingMessage').style.display = 'block';
                            iframe.style.display = 'none';
                        };
                        
                    } catch (error) {
                        console.error('Error loading Google Sheets editor:', error);
                        document.getElementById('loadingMessage').innerHTML = 
                            'Error loading Google Sheets editor: ' + error.message;
                    }
                }
                
                // Handle the Archive button click
                async function archiveUnarchiveUrls() {
                    // Get the button element once and store in window property to avoid redeclaration
                    window.archiveButton = document.querySelector('button[onclick="archiveUnarchiveUrls()"]');
                    
                    try {
                        // Clean the URL - remove only fragment identifiers (#gid=0) but keep query parameters (?gid=0) that the server might need
                        const cleanUrl = window.userGoogleSheetsUrl.split('#')[0];
                        console.log('Original URL:', window.userGoogleSheetsUrl);
                        console.log('Cleaned URL for API calls:', cleanUrl);
                        
                        // Disable button and show checking status
                        if (window.archiveButton) {
                            window.archiveButton.disabled = true;
                            window.archiveButton.textContent = 'Checking permissions...';
                        }
                        
                        // Step 1: Check permissions first
                        console.log('Checking service account permissions...');
                        const permissionResponse = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/check-permissions?url=\${encodeURIComponent(cleanUrl)}&checkWrite=true\`);
                        
                        let hasPermission = false;
                        
                        if (permissionResponse.ok) {
                            const permissionData = await permissionResponse.json();
                            console.log('Permission check response:', permissionData);
                            hasPermission = permissionData.hasPermission === true;
                        } else if (permissionResponse.status === 403) {
                            // 403 on permission check means no access to sheet - this is expected when sheet not shared
                            console.log('Permission check returned 403 - sheet not shared with service account');
                            hasPermission = false;
                        } else {
                            // Other errors (500, 404, etc.) are unexpected
                            throw new Error(\`Permission check failed: \${permissionResponse.status} \${permissionResponse.statusText}\`);
                        }
                        
                        // If no write permission, show the permission dialog immediately
                        if (!hasPermission) {
                            console.log('No write permission detected - showing permission helper dialog');
                            showArchivePermissionDialog(window.userGoogleSheetsUrl);
                            return; // Exit early to show the dialog
                        }
                        
                        // Step 2: Get URL count for time estimation (only if we have permission)
                        console.log('Permission confirmed! Getting URL count for time estimation...');
                        if (window.archiveButton) {
                            window.archiveButton.textContent = 'Getting URL count...';
                        }
                        
                        const countResponse = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/data-for-url?url=\${encodeURIComponent(cleanUrl)}\`);
                        
                        let estimatedUrls = 0;
                        if (countResponse.ok) {
                            const countData = await countResponse.json();
                            estimatedUrls = countData.count || 0;
                            console.log('Estimated URLs to process:', estimatedUrls);
                        }
                        
                        // Step 3: Show progress and start archiving (only if we have permission)
                        if (window.archiveButton) {
                            window.archiveButton.textContent = 'Archiving URLs...';
                        }
                        
                        // Create progress display
                        showArchiveProgress(estimatedUrls);
                        
                        console.log('Archiving URLs for:', cleanUrl);
                        
                        // Get selected archive service and determine time per URL
                        const waybackRadio = document.getElementById('waybackMachineRadio');
                        const bellingcatRadio = document.getElementById('bellingcatRadio');
                        const preValidationCheckbox = document.getElementById('preValidationCheckbox');
                        
                        let timePerUrl;
                        if (bellingcatRadio && bellingcatRadio.checked) {
                            // Bellingcat Auto Archiver: 15 seconds per URL
                            timePerUrl = 15;
                        } else {
                            // Wayback Machine: 2 seconds with prevalidation, 1 second without
                            timePerUrl = (preValidationCheckbox && preValidationCheckbox.checked) ? 2 : 1;
                        }
                        
                        // Start the progress timer
                        const startTime = Date.now();
                        const progressTimer = startArchiveProgressTimer(estimatedUrls, startTime, timePerUrl);
                        
                        // Determine which endpoint to use
                        let endpoint;
                        if (bellingcatRadio && bellingcatRadio.checked) {
                            // Bellingcat - no preValidation parameter
                            endpoint = \`http://localhost:5239/bellingcat/auto-archiver-sheets?url=\${encodeURIComponent(cleanUrl)}\`;
                        } else {
                            // Wayback Machine - include preValidation parameter
                            const preValidation = preValidationCheckbox ? preValidationCheckbox.checked : false;
                            endpoint = \`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/archive-urls?url=\${encodeURIComponent(cleanUrl)}&preValidation=\${preValidation}\`;
                        }
                        
                        // Call the archive endpoint with cleaned URL and preValidation parameter
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        // Clear the progress timer
                        clearInterval(progressTimer);
                        
                        if (!response.ok) {
                            hideArchiveProgress();
                            throw new Error(\`Archive request failed: \${response.status} \${response.statusText}\`);
                        }
                        
                        const result = await response.json();
                        console.log('Archive response:', result);
                        
                        // Hide progress and show completion
                        hideArchiveProgress();
                        
                        // Re-enable the button immediately after successful response
                        if (window.archiveButton) {
                            window.archiveButton.disabled = false;
                            window.archiveButton.textContent = 'Archive unarchived URLs';
                        }
                        
                        // Show success message to user using the correct response format
                        const totalRecords = result.totalRecords || 0;
                        const archivedCount = result.archivedCount || 0;
                        const message = result.message || 'Archive operation completed';
                        const elapsedTime = Math.round((Date.now() - startTime) / 1000);
                        
                        alert(message + '\\n\\nTotal records processed: ' + totalRecords + '\\nURLs archived: ' + archivedCount + '\\nTime taken: ' + elapsedTime + ' seconds');
                        
                    } catch (error) {
                        console.error('Error during archive process:', error);
                        
                        // Hide progress on error
                        hideArchiveProgress();
                        
                        // Re-enable the button immediately after error
                        if (window.archiveButton) {
                            window.archiveButton.disabled = false;
                            window.archiveButton.textContent = 'Archive unarchived URLs';
                        }
                        
                        alert(\`Error: \${error.message}\`);
                    } finally {
                        // Final safety reset (just in case)
                        hideArchiveProgress();
                        if (window.archiveButton) {
                            window.archiveButton.disabled = false;
                            window.archiveButton.textContent = 'Archive unarchived URLs';
                        }
                    }
                }
                
                // Handle the Extract Unspecified Domains button click
                async function extractUnspecifiedDomains() {
                    // Get the button element once and store in window property to avoid redeclaration
                    window.extractDomainsButton = document.querySelector('button[onclick="extractUnspecifiedDomains()"]');
                    
                    try {
                        // Clean the URL - remove only fragment identifiers (#gid=0) but keep query parameters (?gid=0) that the server might need
                        const cleanUrl = window.userGoogleSheetsUrl.split('#')[0];
                        console.log('Original URL:', window.userGoogleSheetsUrl);
                        console.log('Cleaned URL for API calls:', cleanUrl);
                        
                        // Disable button and show checking status
                        if (window.extractDomainsButton) {
                            window.extractDomainsButton.disabled = true;
                            window.extractDomainsButton.textContent = 'Checking permissions...';
                        }
                        
                        // Step 1: Check permissions first
                        console.log('Checking service account permissions...');
                        const permissionResponse = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/check-permissions?url=\${encodeURIComponent(cleanUrl)}&checkWrite=true\`);
                        
                        let hasPermission = false;
                        
                        if (permissionResponse.ok) {
                            const permissionData = await permissionResponse.json();
                            console.log('Permission check response:', permissionData);
                            hasPermission = permissionData.hasPermission === true;
                        } else if (permissionResponse.status === 403) {
                            // 403 on permission check means no access to sheet - this is expected when sheet not shared
                            console.log('Permission check returned 403 - sheet not shared with service account');
                            hasPermission = false;
                        } else {
                            // Other errors (500, 404, etc.) are unexpected
                            throw new Error(\`Permission check failed: \${permissionResponse.status} \${permissionResponse.statusText}\`);
                        }
                        
                        // If no write permission, show the permission dialog immediately
                        if (!hasPermission) {
                            console.log('No write permission detected - showing permission helper dialog');
                            showExtractDomainsPermissionDialog(window.userGoogleSheetsUrl);
                            return; // Exit early to show the dialog
                        }
                        
                        // Step 2: Extract domains (we have permission)
                        console.log('Permission confirmed! Extracting domains...');
                        if (window.extractDomainsButton) {
                            window.extractDomainsButton.textContent = 'Extracting domains...';
                        }
                        
                        console.log('Extracting domains for:', cleanUrl);
                        
                        // Call the extract-domains endpoint with cleaned URL
                        const response = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/extract-domains?url=\${encodeURIComponent(cleanUrl)}\`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (!response.ok) {
                            // Handle different error types
                            if (response.status === 400) {
                                const errorData = await response.json().catch(() => ({}));
                                const errorMessage = errorData.detail?.message || errorData.message || 'Bad request - please check the Google Sheets URL';
                                throw new Error(errorMessage);
                            } else {
                                throw new Error(\`Extract domains request failed: \${response.status} \${response.statusText}\`);
                            }
                        }
                        
                        const result = await response.json();
                        console.log('Extract domains response:', result);
                        
                        // Re-enable the button immediately after successful response
                        if (window.extractDomainsButton) {
                            window.extractDomainsButton.disabled = false;
                            window.extractDomainsButton.textContent = 'Extract unspecified domains';
                        }
                        
                        // Show success message to user using the response format
                        const totalRecords = result.totalRecords || 0;
                        const processedCount = result.processedCount || 0;
                        const extractedCount = result.extractedCount || 0;
                        const failedCount = result.failedCount || 0;
                        const skippedCount = result.skippedCount || 0;
                        const successRate = result.successRate || 0;
                        const message = result.message || 'Domain extraction completed';
                        
                        let alertMessage = message + '\\n\\n';
                        alertMessage += \`Total records: \${totalRecords}\\n\`;
                        if (processedCount > 0) {
                            alertMessage += \`URLs processed: \${processedCount}\\n\`;
                            alertMessage += \`Domains extracted: \${extractedCount}\\n\`;
                            if (failedCount > 0) {
                                alertMessage += \`Failed extractions: \${failedCount}\\n\`;
                            }
                            if (skippedCount > 0) {
                                alertMessage += \`Skipped (already processed): \${skippedCount}\\n\`;
                            }
                            alertMessage += \`Success rate: \${successRate.toFixed(1)}%\`;
                        } else if (skippedCount > 0) {
                            alertMessage += \`All \${skippedCount} URLs were already processed\`;
                        }
                        
                        alert(alertMessage);
                        
                    } catch (error) {
                        console.error('Error during domain extraction process:', error);
                        
                        // Re-enable the button immediately after error
                        if (window.extractDomainsButton) {
                            window.extractDomainsButton.disabled = false;
                            window.extractDomainsButton.textContent = 'Extract unspecified domains';
                        }
                        
                        alert(\`Error: \${error.message}\`);
                    } finally {
                        // Final safety reset (just in case)
                        if (window.extractDomainsButton) {
                            window.extractDomainsButton.disabled = false;
                            window.extractDomainsButton.textContent = 'Extract unspecified domains';
                        }
                    }
                }
                
                // Handle the Extract Unspecified Channels button click (for malicious URLs)
                async function extractUnspecifiedChannels() {
                    // Get the button element once and store in window property to avoid redeclaration
                    window.extractChannelsButton = document.querySelector('button[onclick="extractUnspecifiedChannels()"]');
                    
                    try {
                        // Clean the URL - remove only fragment identifiers (#gid=0) but keep query parameters (?gid=0) that the server might need
                        const cleanUrl = window.userGoogleSheetsUrl.split('#')[0];
                        console.log('Original URL:', window.userGoogleSheetsUrl);
                        console.log('Cleaned URL for API calls:', cleanUrl);
                        
                        // Disable button and show checking status
                        if (window.extractChannelsButton) {
                            window.extractChannelsButton.disabled = true;
                            window.extractChannelsButton.textContent = 'Checking permissions...';
                        }
                        
                        // Step 1: Check permissions first
                        console.log('Checking service account permissions...');
                        const permissionResponse = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/check-permissions?url=\${encodeURIComponent(cleanUrl)}&checkWrite=true\`);
                        
                        let hasPermission = false;
                        
                        if (permissionResponse.ok) {
                            const permissionData = await permissionResponse.json();
                            console.log('Permission check response:', permissionData);
                            hasPermission = permissionData.hasPermission === true;
                        } else if (permissionResponse.status === 403) {
                            // 403 on permission check means no access to sheet - this is expected when sheet not shared
                            console.log('Permission check returned 403 - sheet not shared with service account');
                            hasPermission = false;
                        } else {
                            // Other errors (500, 404, etc.) are unexpected
                            throw new Error(\`Permission check failed: \${permissionResponse.status} \${permissionResponse.statusText}\`);
                        }
                        
                        // If no write permission, show the permission dialog immediately
                        if (!hasPermission) {
                            console.log('No write permission detected - showing permission helper dialog');
                            showExtractChannelsPermissionDialog(window.userGoogleSheetsUrl);
                            return; // Exit early to show the dialog
                        }
                        
                        // Step 2: Extract channels (we have permission)
                        console.log('Permission confirmed! Extracting channels...');
                        if (window.extractChannelsButton) {
                            window.extractChannelsButton.textContent = 'Extracting channels...';
                        }
                        
                        console.log('Extracting channels for:', cleanUrl);
                        
                        // Call the extract-channels endpoint with cleaned URL
                        let response;
                        try {
                            response = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/extract-channels?url=\${encodeURIComponent(cleanUrl)}\`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                        } catch (fetchError) {
                            throw new Error('Unable to connect to the extract channels endpoint. The server may not have implemented the /extract-channels functionality yet. Please contact your administrator or try using the extract domains feature instead.');
                        }
                        
                        if (!response.ok) {
                            // Handle different error types
                            if (response.status === 404) {
                                throw new Error('Extract channels endpoint not found. The server may not have implemented the /extract-channels endpoint yet. Please contact your administrator or use the extract domains functionality instead.');
                            } else if (response.status === 400) {
                                const errorData = await response.json().catch(() => ({}));
                                const errorMessage = errorData.detail?.message || errorData.message || 'Bad request - please check the Google Sheets URL';
                                throw new Error(errorMessage);
                            } else {
                                throw new Error(\`Extract channels request failed: \${response.status} \${response.statusText}\`);
                            }
                        }
                        
                        const result = await response.json();
                        console.log('Extract channels response:', result);
                        
                        // Re-enable the button immediately after successful response
                        if (window.extractChannelsButton) {
                            window.extractChannelsButton.disabled = false;
                            window.extractChannelsButton.textContent = 'Extract unspecified channels';
                        }
                        
                        // Show success message to user using the response format
                        const totalRecords = result.totalRecords || 0;
                        const processedCount = result.processedCount || 0;
                        const extractedCount = result.extractedCount || 0;
                        const failedCount = result.failedCount || 0;
                        const skippedCount = result.skippedCount || 0;
                        const successRate = result.successRate || 0;
                        const message = result.message || 'Channel extraction completed';
                        
                        let alertMessage = message + '\\n\\n';
                        alertMessage += \`Total records: \${totalRecords}\\n\`;
                        if (processedCount > 0) {
                            alertMessage += \`URLs processed: \${processedCount}\\n\`;
                            alertMessage += \`Channels extracted: \${extractedCount}\\n\`;
                            if (failedCount > 0) {
                                alertMessage += \`Failed extractions: \${failedCount}\\n\`;
                            }
                            if (skippedCount > 0) {
                                alertMessage += \`Skipped (already processed): \${skippedCount}\\n\`;
                            }
                            alertMessage += \`Success rate: \${successRate.toFixed(1)}%\`;
                        } else if (skippedCount > 0) {
                            alertMessage += \`All \${skippedCount} URLs were already processed\`;
                        }
                        
                        alert(alertMessage);
                        
                    } catch (error) {
                        console.error('Error during channel extraction process:', error);
                        
                        // Re-enable the button immediately after error
                        if (window.extractChannelsButton) {
                            window.extractChannelsButton.disabled = false;
                            window.extractChannelsButton.textContent = 'Extract unspecified channels';
                        }
                        
                        alert(\`Error: \${error.message}\`);
                    } finally {
                        // Final safety reset (just in case)
                        if (window.extractChannelsButton) {
                            window.extractChannelsButton.disabled = false;
                            window.extractChannelsButton.textContent = 'Extract unspecified channels';
                        }
                    }
                }
                
                // Global variable to store the active timer
                let activeProgressTimer = null;
                
                // Show archive progress with timer
                function showArchiveProgress(estimatedUrls) {
                    // Create or update progress display
                    let progressDiv = document.getElementById('archive-progress-display');
                    if (!progressDiv) {
                        progressDiv = document.createElement('div');
                        progressDiv.id = 'archive-progress-display';
                        progressDiv.style.cssText = \`
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: white;
                            border: 2px solid #007cba;
                            border-radius: 8px;
                            padding: 30px;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                            z-index: 10000;
                            min-width: 350px;
                            text-align: center;
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            cursor: move;
                        \`;
                        document.body.appendChild(progressDiv);
                        
                        // Make the progress display draggable
                        let isDragging = false;
                        let currentX;
                        let currentY;
                        let initialX;
                        let initialY;
                        
                        progressDiv.addEventListener('mousedown', function(e) {
                            isDragging = true;
                            progressDiv.style.cursor = 'grabbing';
                            
                            // Get initial mouse position
                            initialX = e.clientX;
                            initialY = e.clientY;
                            
                            // Get current position
                            const rect = progressDiv.getBoundingClientRect();
                            currentX = rect.left;
                            currentY = rect.top;
                        });
                        
                        document.addEventListener('mousemove', function(e) {
                            if (!isDragging) return;
                            
                            e.preventDefault();
                            
                            // Calculate new position
                            const deltaX = e.clientX - initialX;
                            const deltaY = e.clientY - initialY;
                            
                            // Update position
                            progressDiv.style.left = (currentX + deltaX) + 'px';
                            progressDiv.style.top = (currentY + deltaY) + 'px';
                            progressDiv.style.transform = 'none';
                        });
                        
                        document.addEventListener('mouseup', function() {
                            if (isDragging) {
                                isDragging = false;
                                progressDiv.style.cursor = 'move';
                            }
                        });
                        
                        const estimatedTimeText = estimatedUrls > 0 ? 
                            \`Estimated: \${Math.round(estimatedUrls * 2)} seconds (\${estimatedUrls} URLs × 2s each)\` : 
                            'Calculating estimated time...';
                        
                        progressDiv.innerHTML = \`
                        <div style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">🔄 Archiving URLs</h3>
                            <div style="font-size: 16px; color: #666; margin-bottom: 10px;">Processing your URLs...</div>
                            <div style="font-size: 14px; color: #888;">\${estimatedTimeText}</div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <div style="width: 100%; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
                                <div id="archive-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #007cba, #28a745); transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                        
                        <div id="archive-timer-display" style="font-size: 18px; font-weight: bold; color: #007cba;">
                            Elapsed: 0s | Remaining: calculating...
                        </div>
                        
                        <div style="margin-top: 20px; font-size: 12px; color: #999;">
                            This process archives each URL individually for better reliability
                        </div>
                    \`;
                    }
                }
                
                // Start the progress timer
                function startArchiveProgressTimer(estimatedUrls, startTime, timePerUrl) {
                    // Clear any existing timer first
                    if (activeProgressTimer) {
                        clearInterval(activeProgressTimer);
                    }
                    
                    const averageTimePerUrl = timePerUrl || 2; // seconds (default to 2 if not provided)
                    const estimatedTotalTime = estimatedUrls * averageTimePerUrl;
                    
                    activeProgressTimer = setInterval(() => {
                        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
                        const progressPercent = Math.min((elapsedSeconds / estimatedTotalTime) * 100, 95); // Cap at 95% until complete
                        const remainingSeconds = Math.max(estimatedTotalTime - elapsedSeconds, 0);
                        
                        // Update progress bar
                        const progressBar = document.getElementById('archive-progress-bar');
                        if (progressBar) {
                            progressBar.style.width = progressPercent + '%';
                        }
                        
                        // Update timer display
                        const timerDisplay = document.getElementById('archive-timer-display');
                        if (timerDisplay) {
                            const remainingText = remainingSeconds > 0 ? 
                                \`\${Math.round(remainingSeconds)}s remaining\` : 
                                'Almost done...';
                            timerDisplay.textContent = \`Elapsed: \${elapsedSeconds}s | \${remainingText}\`;
                        }
                    }, 1000);
                    
                    return activeProgressTimer;
                }
                
                // Hide archive progress
                function hideArchiveProgress() {
                    // Clear the timer
                    if (activeProgressTimer) {
                        clearInterval(activeProgressTimer);
                        activeProgressTimer = null;
                    }
                    
                    const progressDiv = document.getElementById('archive-progress-display');
                    if (progressDiv) {
                        progressDiv.remove();
                    }
                }
                
                // Show permission helper dialog for archive operation
                function showArchivePermissionDialog(googleSheetsUrl) {
                    // Extract sheet ID for the sharing URL
                    const sheetId = extractSheetId(googleSheetsUrl);
                    
                    // Create modal overlay
                    const modalOverlay = document.createElement('div');
                    modalOverlay.id = 'archive-permission-modal-overlay';
                    modalOverlay.style.cssText = \`
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.5);
                        z-index: 9999;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    \`;
                    
                    // Create modal content
                    const modalContent = document.createElement('div');
                    modalContent.style.cssText = \`
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                        max-width: 600px;
                        width: 90%;
                        max-height: 90vh;
                        overflow-y: auto;
                        position: relative;
                    \`;
                    
                    modalContent.innerHTML = \`
                        <div style="padding: 30px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                                <h2 style="margin: 0; color: #333; font-size: 24px;">📋 Permission Required for Archiving</h2>
                                <button onclick="closeArchivePermissionDialog()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">&times;</button>
                            </div>
                            
                            <div style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                                <p style="margin: 0; color: #856404;">
                                    <strong>⚠️ Archive Access Denied:</strong> The service needs write permission to update your Google Sheet with archive URLs.
                                </p>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="color: #333; margin-bottom: 15px;">� Step 1: Copy the service account email</h3>
                                <p style="margin-bottom: 15px; color: #666; line-height: 1.5;">
                                    First, copy this service account email to your clipboard:
                                </p>
                                
                                <div style="background: #f8f9fa; border-radius: 6px; padding: 15px; margin-bottom: 15px; text-align: center;">
                                    <p style="margin: 0 0 15px 0; font-family: monospace; background: #e9ecef; padding: 10px; border-radius: 4px; font-size: 14px; word-break: break-all;">
                                        gsheets-service@spheric-baton-459622-f4.iam.gserviceaccount.com
                                    </p>
                                    <button onclick="copyArchiveServiceAccountEmail()" 
                                            style="background: #28a745; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px; margin: 0 auto;">
                                        📋 Copy Service Account Email
                                    </button>
                                </div>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="color: #333; margin-bottom: 15px;">�🔗 Step 2: Share your Google Sheet with write access</h3>
                                <p style="margin-bottom: 15px; color: #666; line-height: 1.5;">
                                    Now open the sharing settings for your Google Sheet and add the service account:
                                </p>
                                
                                <button onclick="openArchiveSharingSettings('\${sheetId}')" 
                                        style="background: #1a73e8; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; width: 100%; justify-content: center;">
                                    📤 Open Google Sheets Sharing Settings
                                </button>
                                
                                <div style="background: #f8f9fa; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">In the sharing dialog:</p>
                                    <ol style="margin: 0; padding-left: 20px; color: #666; line-height: 1.6;">
                                        <li>Click "Add people and groups"</li>
                                        <li>Paste the copied service account email</li>
                                        <li>Set permission to <strong>"Editor"</strong> (not Viewer)</li>
                                        <li>Click "Send" or "Share"</li>
                                    </ol>
                                </div>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="color: #333; margin-bottom: 15px;">✅ Step 3: Retry archiving</h3>
                                <p style="margin-bottom: 15px; color: #666; line-height: 1.5;">
                                    After sharing the sheet with Editor permissions, click the button below to retry archiving:
                                </p>
                                
                                <button onclick="retryArchivingAfterSharing('\${googleSheetsUrl}')" 
                                        style="background: #17a2b8; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; width: 100%; justify-content: center;">
                                    🔄 Retry Archiving URLs
                                </button>
                                
                                <div id="archive-retry-status" style="margin-top: 10px; padding: 10px; border-radius: 4px; display: none;"></div>
                            </div>

                            <div style="border-top: 1px solid #dee2e6; padding-top: 20px;">
                                <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
                                    💡 <strong>Why do we need this?</strong> Our service account needs write access to add archive URLs to your Google Sheet automatically.
                                </p>
                            </div>
                        </div>
                    \`;
                    
                    modalOverlay.appendChild(modalContent);
                    document.body.appendChild(modalOverlay);
                    
                    // Close modal when clicking outside
                    modalOverlay.addEventListener('click', function(e) {
                        if (e.target === modalOverlay) {
                            closeArchivePermissionDialog();
                        }
                    });
                }
                
                // Extract sheet ID from Google Sheets URL
                function extractSheetId(url) {
                    try {
                        const match = url.match(/\\/spreadsheets\\/d\\/([a-zA-Z0-9-_]+)/);
                        return match ? match[1] : null;
                    } catch (error) {
                        console.error('Error extracting sheet ID:', error);
                        return null;
                    }
                }
                
                // Open Google Sheets sharing settings for archive
                function openArchiveSharingSettings(sheetId) {
                    if (!sheetId) {
                        alert('Unable to extract sheet ID from URL');
                        return;
                    }
                    
                    // Use the sharing-specific URL that opens the sharing dialog directly
                    const sharingUrl = \`https://docs.google.com/spreadsheets/d/\${sheetId}/edit?usp=sharing\`;
                    window.open(sharingUrl, '_blank', 'width=1000,height=700');
                }
                
                // Copy service account email to clipboard for archive
                function copyArchiveServiceAccountEmail() {
                    const email = 'gsheets-service@spheric-baton-459622-f4.iam.gserviceaccount.com';
                    const button = event.target; // Get the button that was clicked
                    
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(email).then(() => {
                            showArchiveCopyFeedback(button);
                        }).catch(err => {
                            console.error('Failed to copy with Clipboard API:', err);
                            fallbackArchiveCopyText(email, button);
                        });
                    } else {
                        fallbackArchiveCopyText(email, button);
                    }
                }
                
                // Fallback copy method for archive
                function fallbackArchiveCopyText(text, button) {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    try {
                        const successful = document.execCommand('copy');
                        if (successful) {
                            showArchiveCopyFeedback(button);
                        } else {
                            alert('Copy failed. Please manually copy: ' + text);
                        }
                    } catch (err) {
                        console.error('Fallback copy failed:', err);
                        alert('Copy failed. Please manually copy: ' + text);
                    }
                    
                    document.body.removeChild(textArea);
                }
                
                // Show copy feedback for archive
                function showArchiveCopyFeedback(button) {
                    if (!button) return; // Safety check
                    
                    const originalText = button.innerHTML;
                    button.innerHTML = '✅ Copied!';
                    button.style.background = '#28a745';
                    
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.style.background = '#28a745';
                    }, 2000);
                }
                
                // Retry archiving after sharing
                async function retryArchivingAfterSharing(googleSheetsUrl) {
                    const button = event.target;
                    const statusDiv = document.getElementById('archive-retry-status');
                    
                    try {
                        // Update button state
                        button.disabled = true;
                        button.innerHTML = '🔄 Checking permissions...';
                        
                        // Show checking status
                        statusDiv.style.display = 'block';
                        statusDiv.style.background = '#d1ecf1';
                        statusDiv.style.color = '#0c5460';
                        statusDiv.style.border = '1px solid #bee5eb';
                        statusDiv.innerHTML = '🔍 Checking if permissions were granted...';
                        
                        // Clean the URL - remove only fragment identifiers (#gid=0) but keep query parameters (?gid=0) that the server might need
                        const cleanUrl = googleSheetsUrl.split('#')[0];
                        console.log('Original URL:', googleSheetsUrl);
                        console.log('Cleaned URL:', cleanUrl);
                        
                        // Step 1: Check permissions first
                        const permissionResponse = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/check-permissions?url=\${encodeURIComponent(cleanUrl)}&checkWrite=true\`);
                        
                        let hasPermission = false;
                        
                        if (permissionResponse.ok) {
                            const permissionData = await permissionResponse.json();
                            console.log('Permission check response:', permissionData);
                            hasPermission = permissionData.hasPermission === true;
                        } else if (permissionResponse.status === 403) {
                            // 403 on permission check means no access to sheet - still no permission granted
                            console.log('Permission check still returns 403 - sheet still not shared with service account');
                            hasPermission = false;
                        } else {
                            // Other errors (500, 404, etc.) are unexpected
                            throw new Error(\`Permission check failed: \${permissionResponse.status} \${permissionResponse.statusText}\`);
                        }
                        
                        // If still no write permission, show error
                        if (!hasPermission) {
                            statusDiv.style.background = '#f8d7da';
                            statusDiv.style.color = '#721c24';
                            statusDiv.style.border = '1px solid #f5c6cb';
                            statusDiv.innerHTML = '❌ Still no write access. Please make sure you shared the sheet with Editor permissions and try again.';
                            return;
                        }
                        
                        // Step 2: Permissions confirmed! Close dialog and start full archive process
                        console.log('Permissions confirmed! Closing dialog and starting archive with progress timer...');
                        
                        // Close the permission dialog immediately
                        closeArchivePermissionDialog();
                        
                        // Get URL count for time estimation
                        const countResponse = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/data-for-url?url=\${encodeURIComponent(cleanUrl)}\`);
                        
                        let estimatedUrls = 0;
                        if (countResponse.ok) {
                            const countData = await countResponse.json();
                            estimatedUrls = countData.count || 0;
                            console.log('Estimated URLs to process:', estimatedUrls);
                        }
                        
                        // Show progress display with timer
                        showArchiveProgress(estimatedUrls);
                        
                        // Get selected archive service and determine time per URL
                        const waybackRadio = document.getElementById('waybackMachineRadio');
                        const bellingcatRadio = document.getElementById('bellingcatRadio');
                        const preValidationCheckbox = document.getElementById('preValidationCheckbox');
                        
                        let timePerUrl;
                        if (bellingcatRadio && bellingcatRadio.checked) {
                            // Bellingcat Auto Archiver: 15 seconds per URL
                            timePerUrl = 15;
                        } else {
                            // Wayback Machine: 2 seconds with prevalidation, 1 second without
                            timePerUrl = (preValidationCheckbox && preValidationCheckbox.checked) ? 2 : 1;
                        }
                        
                        // Start the progress timer
                        const startTime = Date.now();
                        const progressTimer = startArchiveProgressTimer(estimatedUrls, startTime, timePerUrl);
                        
                        // Determine which endpoint to use
                        let endpoint;
                        if (bellingcatRadio && bellingcatRadio.checked) {
                            // Bellingcat - no preValidation parameter
                            endpoint = \`http://localhost:5239/bellingcat/auto-archiver-sheets?url=\${encodeURIComponent(cleanUrl)}\`;
                        } else {
                            // Wayback Machine - include preValidation parameter
                            const preValidation = preValidationCheckbox ? preValidationCheckbox.checked : false;
                            endpoint = \`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/archive-urls?url=\${encodeURIComponent(cleanUrl)}&preValidation=\${preValidation}\`;
                        }
                        
                        // Call the archive endpoint with cleaned URL and preValidation parameter
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        // Clear the progress timer
                        clearInterval(progressTimer);
                        
                        if (response.ok) {
                            const result = await response.json();
                            
                            // Success! Hide progress and show completion
                            hideArchiveProgress();
                            
                            const totalRecords = result.totalRecords || 0;
                            const archivedCount = result.archivedCount || 0;
                            const message = result.message || 'Archive operation completed';
                            const elapsedTime = Math.round((Date.now() - startTime) / 1000);
                            
                            alert(message + '\\n\\nTotal records processed: ' + totalRecords + '\\nURLs archived: ' + archivedCount + '\\nTime taken: ' + elapsedTime + ' seconds');
                            
                        } else {
                            // Archive failed for other reasons
                            hideArchiveProgress();
                            throw new Error(\`Archive request failed: \${response.status} \${response.statusText}\`);
                        }
                        
                    } catch (error) {
                        console.error('Error during archive retry:', error);
                        statusDiv.style.display = 'block';
                        statusDiv.style.background = '#f8d7da';
                        statusDiv.style.color = '#721c24';
                        statusDiv.style.border = '1px solid #f5c6cb';
                        statusDiv.innerHTML = \`❌ Error: \${error.message}\`;
                    } finally {
                        // Reset button
                        button.disabled = false;
                        button.innerHTML = '🔄 Retry Archiving URLs';
                    }
                }
                
                // Close archive permission dialog
                function closeArchivePermissionDialog() {
                    const modal = document.getElementById('archive-permission-modal-overlay');
                    if (modal) {
                        modal.remove();
                    }
                    
                    // Re-enable the main archive button
                    if (window.archiveButton) {
                        window.archiveButton.disabled = false;
                        window.archiveButton.textContent = 'Archive unarchived URLs';
                    }
                }
                
                // Show permission helper dialog for extract domains operation
                function showExtractDomainsPermissionDialog(googleSheetsUrl) {
                    // Extract sheet ID for the sharing URL
                    const sheetId = extractSheetId(googleSheetsUrl);
                    
                    // Create modal overlay
                    const modalOverlay = document.createElement('div');
                    modalOverlay.id = 'extract-domains-permission-modal-overlay';
                    modalOverlay.style.cssText = \`
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.5);
                        z-index: 9999;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    \`;
                    
                    // Create modal content
                    const modalContent = document.createElement('div');
                    modalContent.style.cssText = \`
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                        max-width: 600px;
                        width: 90%;
                        max-height: 90vh;
                        overflow-y: auto;
                        position: relative;
                    \`;
                    
                    modalContent.innerHTML = \`
                        <div style="padding: 30px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                                <h2 style="margin: 0; color: #333; font-size: 24px;">🌐 Permission Required for Domain Extraction</h2>
                                <button onclick="closeExtractDomainsPermissionDialog()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">&times;</button>
                            </div>
                            
                            <div style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                                <p style="margin: 0; color: #856404;">
                                    <strong>⚠️ Domain Extraction Access Denied:</strong> The service needs write permission to update your Google Sheet with extracted domain names.
                                </p>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="color: #333; margin-bottom: 15px;">📧 Step 1: Copy the service account email</h3>
                                <p style="margin-bottom: 15px; color: #666; line-height: 1.5;">
                                    First, copy this service account email to your clipboard:
                                </p>
                                
                                <div style="background: #f8f9fa; border-radius: 6px; padding: 15px; margin-bottom: 15px; text-align: center;">
                                    <p style="margin: 0 0 15px 0; font-family: monospace; background: #e9ecef; padding: 10px; border-radius: 4px; font-size: 14px; word-break: break-all;">
                                        gsheets-service@spheric-baton-459622-f4.iam.gserviceaccount.com
                                    </p>
                                    <button onclick="copyExtractDomainsServiceAccountEmail()" 
                                            style="background: #28a745; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px; margin: 0 auto;">
                                        📋 Copy Service Account Email
                                    </button>
                                </div>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="color: #333; margin-bottom: 15px;">🔗 Step 2: Share your Google Sheet with write access</h3>
                                <p style="margin-bottom: 15px; color: #666; line-height: 1.5;">
                                    Now open the sharing settings for your Google Sheet and add the service account:
                                </p>
                                
                                <button onclick="openExtractDomainsSharingSettings('\${sheetId}')" 
                                        style="background: #1a73e8; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; width: 100%; justify-content: center;">
                                    📤 Open Google Sheets Sharing Settings
                                </button>
                                
                                <div style="background: #f8f9fa; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">In the sharing dialog:</p>
                                    <ol style="margin: 0; padding-left: 20px; color: #666; line-height: 1.6;">
                                        <li>Click "Add people and groups"</li>
                                        <li>Paste the copied service account email</li>
                                        <li>Set permission to <strong>"Editor"</strong> (not Viewer)</li>
                                        <li>Click "Send" or "Share"</li>
                                    </ol>
                                </div>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="color: #333; margin-bottom: 15px;">✅ Step 3: Retry domain extraction</h3>
                                <p style="margin-bottom: 15px; color: #666; line-height: 1.5;">
                                    After sharing the sheet with Editor permissions, click the button below to retry domain extraction:
                                </p>
                                
                                <button onclick="retryExtractDomainsAfterSharing('\${googleSheetsUrl}')" 
                                        style="background: #17a2b8; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; width: 100%; justify-content: center;">
                                    🔄 Retry Domain Extraction
                                </button>
                                
                                <div id="extract-domains-retry-status" style="margin-top: 10px; padding: 10px; border-radius: 4px; display: none;"></div>
                            </div>

                            <div style="border-top: 1px solid #dee2e6; padding-top: 20px;">
                                <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
                                    💡 <strong>Why do we need this?</strong> Our service account needs write access to add extracted domain names to your Google Sheet automatically.
                                </p>
                            </div>
                        </div>
                    \`;
                    
                    modalOverlay.appendChild(modalContent);
                    document.body.appendChild(modalOverlay);
                    
                    // Close modal when clicking outside
                    modalOverlay.addEventListener('click', function(e) {
                        if (e.target === modalOverlay) {
                            closeExtractDomainsPermissionDialog();
                        }
                    });
                }
                
                // Open Google Sheets sharing settings for extract domains
                function openExtractDomainsSharingSettings(sheetId) {
                    if (!sheetId) {
                        alert('Unable to extract sheet ID from URL');
                        return;
                    }
                    
                    // Use the sharing-specific URL that opens the sharing dialog directly
                    const sharingUrl = \`https://docs.google.com/spreadsheets/d/\${sheetId}/edit?usp=sharing\`;
                    window.open(sharingUrl, '_blank', 'width=1000,height=700');
                }
                
                // Copy service account email to clipboard for extract domains
                function copyExtractDomainsServiceAccountEmail() {
                    const email = 'gsheets-service@spheric-baton-459622-f4.iam.gserviceaccount.com';
                    const button = event.target; // Get the button that was clicked
                    
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(email).then(() => {
                            showExtractDomainsCopyFeedback(button);
                        }).catch(err => {
                            console.error('Failed to copy with Clipboard API:', err);
                            fallbackExtractDomainsCopyText(email, button);
                        });
                    } else {
                        fallbackExtractDomainsCopyText(email, button);
                    }
                }
                
                // Fallback copy method for extract domains
                function fallbackExtractDomainsCopyText(text, button) {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    try {
                        const successful = document.execCommand('copy');
                        if (successful) {
                            showExtractDomainsCopyFeedback(button);
                        } else {
                            alert('Copy failed. Please manually copy: ' + text);
                        }
                    } catch (err) {
                        console.error('Fallback copy failed:', err);
                        alert('Copy failed. Please manually copy: ' + text);
                    }
                    
                    document.body.removeChild(textArea);
                }
                
                // Show copy feedback for extract domains
                function showExtractDomainsCopyFeedback(button) {
                    if (!button) return; // Safety check
                    
                    const originalText = button.innerHTML;
                    button.innerHTML = '✅ Copied!';
                    button.style.background = '#28a745';
                    
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.style.background = '#28a745';
                    }, 2000);
                }
                
                // Retry domain extraction after sharing
                async function retryExtractDomainsAfterSharing(googleSheetsUrl) {
                    const button = event.target;
                    const statusDiv = document.getElementById('extract-domains-retry-status');
                    
                    try {
                        // Update button state
                        button.disabled = true;
                        button.innerHTML = '🔄 Checking permissions...';
                        
                        // Show checking status
                        statusDiv.style.display = 'block';
                        statusDiv.style.background = '#d1ecf1';
                        statusDiv.style.color = '#0c5460';
                        statusDiv.style.border = '1px solid #bee5eb';
                        statusDiv.innerHTML = '🔍 Checking if permissions were granted...';
                        
                        // Clean the URL - remove only fragment identifiers (#gid=0) but keep query parameters (?gid=0) that the server might need
                        const cleanUrl = googleSheetsUrl.split('#')[0];
                        console.log('Original URL:', googleSheetsUrl);
                        console.log('Cleaned URL:', cleanUrl);
                        
                        // Step 1: Check permissions first
                        const permissionResponse = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/check-permissions?url=\${encodeURIComponent(cleanUrl)}&checkWrite=true\`);
                        
                        let hasPermission = false;
                        
                        if (permissionResponse.ok) {
                            const permissionData = await permissionResponse.json();
                            console.log('Permission check response:', permissionData);
                            hasPermission = permissionData.hasPermission === true;
                        } else if (permissionResponse.status === 403) {
                            // 403 on permission check means no access to sheet - still no permission granted
                            console.log('Permission check still returns 403 - sheet still not shared with service account');
                            hasPermission = false;
                        } else {
                            // Other errors (500, 404, etc.) are unexpected
                            throw new Error(\`Permission check failed: \${permissionResponse.status} \${permissionResponse.statusText}\`);
                        }
                        
                        // If still no write permission, show error
                        if (!hasPermission) {
                            statusDiv.style.background = '#f8d7da';
                            statusDiv.style.color = '#721c24';
                            statusDiv.style.border = '1px solid #f5c6cb';
                            statusDiv.innerHTML = '❌ Still no write access. Please make sure you shared the sheet with Editor permissions and try again.';
                            return;
                        }
                        
                        // Step 2: Permissions confirmed! Close dialog and start extraction process
                        console.log('Permissions confirmed! Closing dialog and starting domain extraction...');
                        
                        // Close the permission dialog immediately
                        closeExtractDomainsPermissionDialog();
                        
                        console.log('Extracting domains for:', cleanUrl);
                        
                        // Call the extract-domains endpoint with cleaned URL
                        const response = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/extract-domains?url=\${encodeURIComponent(cleanUrl)}\`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (response.ok) {
                            const result = await response.json();
                            
                            // Success!
                            console.log('Extract domains response:', result);
                            
                            // Show success message to user using the response format
                            const totalRecords = result.totalRecords || 0;
                            const processedCount = result.processedCount || 0;
                            const extractedCount = result.extractedCount || 0;
                            const failedCount = result.failedCount || 0;
                            const skippedCount = result.skippedCount || 0;
                            const successRate = result.successRate || 0;
                            const message = result.message || 'Domain extraction completed';
                            
                            let alertMessage = message + '\\n\\n';
                            alertMessage += \`Total records: \${totalRecords}\\n\`;
                            if (processedCount > 0) {
                                alertMessage += \`URLs processed: \${processedCount}\\n\`;
                                alertMessage += \`Domains extracted: \${extractedCount}\\n\`;
                                if (failedCount > 0) {
                                    alertMessage += \`Failed extractions: \${failedCount}\\n\`;
                                }
                                if (skippedCount > 0) {
                                    alertMessage += \`Skipped (already processed): \${skippedCount}\\n\`;
                                }
                                alertMessage += \`Success rate: \${successRate.toFixed(1)}%\`;
                            } else if (skippedCount > 0) {
                                alertMessage += \`All \${skippedCount} URLs were already processed\`;
                            }
                            
                            alert(alertMessage);
                            
                        } else {
                            // Extract domains failed for other reasons
                            if (response.status === 400) {
                                const errorData = await response.json().catch(() => ({}));
                                const errorMessage = errorData.detail?.message || errorData.message || 'Bad request - please check the Google Sheets URL';
                                throw new Error(errorMessage);
                            } else {
                                throw new Error(\`Extract domains request failed: \${response.status} \${response.statusText}\`);
                            }
                        }
                        
                    } catch (error) {
                        console.error('Error during domain extraction retry:', error);
                        statusDiv.style.display = 'block';
                        statusDiv.style.background = '#f8d7da';
                        statusDiv.style.color = '#721c24';
                        statusDiv.style.border = '1px solid #f5c6cb';
                        statusDiv.innerHTML = \`❌ Error: \${error.message}\`;
                    } finally {
                        // Reset button
                        button.disabled = false;
                        button.innerHTML = '🔄 Retry Domain Extraction';
                    }
                }
                
                // Close extract domains permission dialog
                function closeExtractDomainsPermissionDialog() {
                    const modal = document.getElementById('extract-domains-permission-modal-overlay');
                    if (modal) {
                        modal.remove();
                    }
                    
                    // Re-enable the main extract domains button
                    if (window.extractDomainsButton) {
                        window.extractDomainsButton.disabled = false;
                        window.extractDomainsButton.textContent = 'Extract unspecified domains';
                    }
                }
                
                // Show permission helper dialog for extract channels operation
                function showExtractChannelsPermissionDialog(googleSheetsUrl) {
                    // Extract sheet ID for the sharing URL
                    const sheetId = extractSheetId(googleSheetsUrl);
                    
                    // Create modal overlay
                    const modalOverlay = document.createElement('div');
                    modalOverlay.id = 'extract-channels-permission-modal-overlay';
                    modalOverlay.style.cssText = \`
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.5);
                        z-index: 9999;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    \`;
                    
                    // Create modal content
                    const modalContent = document.createElement('div');
                    modalContent.style.cssText = \`
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                        max-width: 600px;
                        width: 90%;
                        max-height: 90vh;
                        overflow-y: auto;
                        position: relative;
                    \`;
                    
                    modalContent.innerHTML = \`
                        <div style="padding: 30px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                                <h2 style="margin: 0; color: #333; font-size: 24px;">📺 Permission Required for Channel Extraction</h2>
                                <button onclick="closeExtractChannelsPermissionDialog()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">&times;</button>
                            </div>
                            
                            <div style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                                <p style="margin: 0; color: #856404;">
                                    <strong>⚠️ Channel Extraction Access Denied:</strong> The service needs write permission to update your Google Sheet with extracted channel names.
                                </p>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="color: #333; margin-bottom: 15px;">📧 Step 1: Copy the service account email</h3>
                                <p style="margin-bottom: 15px; color: #666; line-height: 1.5;">
                                    First, copy this service account email to your clipboard:
                                </p>
                                
                                <div style="background: #f8f9fa; border-radius: 6px; padding: 15px; margin-bottom: 15px; text-align: center;">
                                    <p style="margin: 0 0 15px 0; font-family: monospace; background: #e9ecef; padding: 10px; border-radius: 4px; font-size: 14px; word-break: break-all;">
                                        gsheets-service@spheric-baton-459622-f4.iam.gserviceaccount.com
                                    </p>
                                    <button onclick="copyExtractChannelsServiceAccountEmail()" 
                                            style="background: #28a745; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px; margin: 0 auto;">
                                        📋 Copy Service Account Email
                                    </button>
                                </div>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="color: #333; margin-bottom: 15px;">🔗 Step 2: Share your Google Sheet with write access</h3>
                                <p style="margin-bottom: 15px; color: #666; line-height: 1.5;">
                                    Now open the sharing settings for your Google Sheet and add the service account:
                                </p>
                                
                                <button onclick="openExtractChannelsSharingSettings('\${sheetId}')" 
                                        style="background: #1a73e8; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; width: 100%; justify-content: center;">
                                    📤 Open Google Sheets Sharing Settings
                                </button>
                                
                                <div style="background: #f8f9fa; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">In the sharing dialog:</p>
                                    <ol style="margin: 0; padding-left: 20px; color: #666; line-height: 1.6;">
                                        <li>Click "Add people and groups"</li>
                                        <li>Paste the copied service account email</li>
                                        <li>Set permission to <strong>"Editor"</strong> (not Viewer)</li>
                                        <li>Click "Send" or "Share"</li>
                                    </ol>
                                </div>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="color: #333; margin-bottom: 15px;">✅ Step 3: Retry channel extraction</h3>
                                <p style="margin-bottom: 15px; color: #666; line-height: 1.5;">
                                    After sharing the sheet with Editor permissions, click the button below to retry channel extraction:
                                </p>
                                
                                <button onclick="retryExtractChannelsAfterSharing('\${googleSheetsUrl}')" 
                                        style="background: #17a2b8; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; width: 100%; justify-content: center;">
                                    🔄 Retry Channel Extraction
                                </button>
                                
                                <div id="extract-channels-retry-status" style="margin-top: 10px; padding: 10px; border-radius: 4px; display: none;"></div>
                            </div>

                            <div style="border-top: 1px solid #dee2e6; padding-top: 20px;">
                                <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
                                    💡 <strong>Why do we need this?</strong> Our service account needs write access to add extracted channel names to your Google Sheet automatically.
                                </p>
                            </div>
                        </div>
                    \`;
                    
                    modalOverlay.appendChild(modalContent);
                    document.body.appendChild(modalOverlay);
                    
                    // Close modal when clicking outside
                    modalOverlay.addEventListener('click', function(e) {
                        if (e.target === modalOverlay) {
                            closeExtractChannelsPermissionDialog();
                        }
                    });
                }
                
                // Open Google Sheets sharing settings for extract channels
                function openExtractChannelsSharingSettings(sheetId) {
                    if (!sheetId) {
                        alert('Unable to extract sheet ID from URL');
                        return;
                    }
                    
                    // Use the sharing-specific URL that opens the sharing dialog directly
                    const sharingUrl = \`https://docs.google.com/spreadsheets/d/\${sheetId}/edit?usp=sharing\`;
                    window.open(sharingUrl, '_blank', 'width=1000,height=700');
                }
                
                // Copy service account email to clipboard for extract channels
                function copyExtractChannelsServiceAccountEmail() {
                    const email = 'gsheets-service@spheric-baton-459622-f4.iam.gserviceaccount.com';
                    const button = event.target; // Get the button that was clicked
                    
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(email).then(() => {
                            showExtractChannelsCopyFeedback(button);
                        }).catch(err => {
                            console.error('Failed to copy with Clipboard API:', err);
                            fallbackExtractChannelsCopyText(email, button);
                        });
                    } else {
                        fallbackExtractChannelsCopyText(email, button);
                    }
                }
                
                // Fallback copy method for extract channels
                function fallbackExtractChannelsCopyText(text, button) {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    try {
                        const successful = document.execCommand('copy');
                        if (successful) {
                            showExtractChannelsCopyFeedback(button);
                        } else {
                            alert('Copy failed. Please manually copy: ' + text);
                        }
                    } catch (err) {
                        console.error('Fallback copy failed:', err);
                        alert('Copy failed. Please manually copy: ' + text);
                    }
                    
                    document.body.removeChild(textArea);
                }
                
                // Show copy feedback for extract channels
                function showExtractChannelsCopyFeedback(button) {
                    if (!button) return; // Safety check
                    
                    const originalText = button.innerHTML;
                    button.innerHTML = '✅ Copied!';
                    button.style.background = '#28a745';
                    
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.style.background = '#28a745';
                    }, 2000);
                }
                
                // Retry channel extraction after sharing
                async function retryExtractChannelsAfterSharing(googleSheetsUrl) {
                    const button = event.target;
                    const statusDiv = document.getElementById('extract-channels-retry-status');
                    
                    try {
                        // Update button state
                        button.disabled = true;
                        button.innerHTML = '🔄 Checking permissions...';
                        
                        // Show checking status
                        statusDiv.style.display = 'block';
                        statusDiv.style.background = '#d1ecf1';
                        statusDiv.style.color = '#0c5460';
                        statusDiv.style.border = '1px solid #bee5eb';
                        statusDiv.innerHTML = '🔍 Checking if permissions were granted...';
                        
                        // Clean the URL - remove only fragment identifiers (#gid=0) but keep query parameters (?gid=0) that the server might need
                        const cleanUrl = googleSheetsUrl.split('#')[0];
                        console.log('Original URL:', googleSheetsUrl);
                        console.log('Cleaned URL:', cleanUrl);
                        
                        // Step 1: Check permissions first
                        const permissionResponse = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/check-permissions?url=\${encodeURIComponent(cleanUrl)}&checkWrite=true\`);
                        
                        let hasPermission = false;
                        
                        if (permissionResponse.ok) {
                            const permissionData = await permissionResponse.json();
                            console.log('Permission check response:', permissionData);
                            hasPermission = permissionData.hasPermission === true;
                        } else if (permissionResponse.status === 403) {
                            // 403 on permission check means no access to sheet - still no permission granted
                            console.log('Permission check still returns 403 - sheet still not shared with service account');
                            hasPermission = false;
                        } else {
                            // Other errors (500, 404, etc.) are unexpected
                            throw new Error(\`Permission check failed: \${permissionResponse.status} \${permissionResponse.statusText}\`);
                        }
                        
                        // If still no write permission, show error
                        if (!hasPermission) {
                            statusDiv.style.background = '#f8d7da';
                            statusDiv.style.color = '#721c24';
                            statusDiv.style.border = '1px solid #f5c6cb';
                            statusDiv.innerHTML = '❌ Still no write access. Please make sure you shared the sheet with Editor permissions and try again.';
                            return;
                        }
                        
                        // Step 2: Permissions confirmed! Close dialog and start extraction process
                        console.log('Permissions confirmed! Closing dialog and starting channel extraction...');
                        
                        // Close the permission dialog immediately
                        closeExtractChannelsPermissionDialog();
                        
                        console.log('Extracting channels for:', cleanUrl);
                        
                        // Call the extract-channels endpoint with cleaned URL
                        let response;
                        try {
                            response = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/extract-channels?url=\${encodeURIComponent(cleanUrl)}\`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                        } catch (fetchError) {
                            throw new Error('Unable to connect to the extract channels endpoint. The server may not have implemented the /extract-channels functionality yet. Please contact your administrator or try using the extract domains feature instead.');
                        }
                        
                        if (response.ok) {
                            const result = await response.json();
                            
                            // Success!
                            console.log('Extract channels response:', result);
                            
                            // Show success message to user using the response format
                            const totalRecords = result.totalRecords || 0;
                            const processedCount = result.processedCount || 0;
                            const extractedCount = result.extractedCount || 0;
                            const failedCount = result.failedCount || 0;
                            const skippedCount = result.skippedCount || 0;
                            const successRate = result.successRate || 0;
                            const message = result.message || 'Channel extraction completed';
                            
                            let alertMessage = message + '\\n\\n';
                            alertMessage += \`Total records: \${totalRecords}\\n\`;
                            if (processedCount > 0) {
                                alertMessage += \`URLs processed: \${processedCount}\\n\`;
                                alertMessage += \`Channels extracted: \${extractedCount}\\n\`;
                                if (failedCount > 0) {
                                    alertMessage += \`Failed extractions: \${failedCount}\\n\`;
                                }
                                if (skippedCount > 0) {
                                    alertMessage += \`Skipped (already processed): \${skippedCount}\\n\`;
                                }
                                alertMessage += \`Success rate: \${successRate.toFixed(1)}%\`;
                            } else if (skippedCount > 0) {
                                alertMessage += \`All \${skippedCount} URLs were already processed\`;
                            }
                            
                            alert(alertMessage);
                            
                        } else {
                            // Extract channels failed for other reasons
                            if (response.status === 404) {
                                throw new Error('Extract channels endpoint not found. The server may not have implemented the /extract-channels endpoint yet. Please contact your administrator or use the extract domains functionality instead.');
                            } else if (response.status === 400) {
                                const errorData = await response.json().catch(() => ({}));
                                const errorMessage = errorData.detail?.message || errorData.message || 'Bad request - please check the Google Sheets URL';
                                throw new Error(errorMessage);
                            } else {
                                throw new Error(\`Extract channels request failed: \${response.status} \${response.statusText}\`);
                            }
                        }
                        
                    } catch (error) {
                        console.error('Error during channel extraction retry:', error);
                        statusDiv.style.display = 'block';
                        statusDiv.style.background = '#f8d7da';
                        statusDiv.style.color = '#721c24';
                        statusDiv.style.border = '1px solid #f5c6cb';
                        statusDiv.innerHTML = \`❌ Error: \${error.message}\`;
                    } finally {
                        // Reset button
                        button.disabled = false;
                        button.innerHTML = '🔄 Retry Channel Extraction';
                    }
                }
                
                // Close extract channels permission dialog
                function closeExtractChannelsPermissionDialog() {
                    const modal = document.getElementById('extract-channels-permission-modal-overlay');
                    if (modal) {
                        modal.remove();
                    }
                    
                    // Re-enable the main extract channels button
                    if (window.extractChannelsButton) {
                        window.extractChannelsButton.disabled = false;
                        window.extractChannelsButton.textContent = 'Extract unspecified channels';
                    }
                }
                
                // Handle the Done button click
                function handleDoneClick() {
                    // Close this window and trigger the data loading in the parent
                    window.opener.loadUrlsFromGoogleSheetsData(window.userGoogleSheetsUrl, '${urlType}');
                    window.close();
                }
                
                // Setup archive service radio button listeners
                function setupArchiveServiceListeners() {
                    const waybackRadio = document.getElementById('waybackMachineRadio');
                    const bellingcatRadio = document.getElementById('bellingcatRadio');
                    const preValidationCheckbox = document.getElementById('preValidationCheckbox');
                    const preValidationLabel = document.getElementById('preValidationLabel');
                    
                    function updatePrevalidationState() {
                        if (bellingcatRadio && bellingcatRadio.checked) {
                            // Bellingcat selected - gray out prevalidation but keep the state
                            preValidationLabel.style.opacity = '0.4';
                            preValidationLabel.style.cursor = 'not-allowed';
                            preValidationCheckbox.style.cursor = 'not-allowed';
                            preValidationLabel.style.pointerEvents = 'none';
                        } else {
                            // Wayback Machine selected - enable prevalidation
                            preValidationLabel.style.opacity = '1';
                            preValidationLabel.style.cursor = 'pointer';
                            preValidationCheckbox.style.cursor = 'pointer';
                            preValidationLabel.style.pointerEvents = 'auto';
                        }
                    }
                    
                    if (waybackRadio) {
                        waybackRadio.addEventListener('change', updatePrevalidationState);
                    }
                    if (bellingcatRadio) {
                        bellingcatRadio.addEventListener('change', updatePrevalidationState);
                    }
                    
                    // Set initial state
                    updatePrevalidationState();
                }
                
                // Load the editor when the page loads
                window.addEventListener('load', function() {
                    loadGoogleSheetsEditor();
                    setupArchiveServiceListeners();
                });
            </script>
        </body>
        </html>
    `);
    
    popup.document.close();
}

// Function to actually load the data from Google Sheets (called after editing)
async function loadUrlsFromGoogleSheetsData(googleSheetsUrl, urlType = 'trusted') {
    const config = URL_TYPES[urlType];
    const urlsArray = getUrlsArray(urlType);
    
    try {
        console.log(`Loading ${urlType} URLs from Google Sheets...`);
        console.log('Using URL:', googleSheetsUrl);
        
        // Call the new endpoint with the user-provided URL
        const response = await fetch(`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/data-for-url?url=${encodeURIComponent(googleSheetsUrl)}`);
        
        // Check if the response is ok
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication required. Please check your API credentials.');
            } else if (response.status === 403) {
                throw new Error('Permission denied. Please ensure the Google Sheet is shared with the service account or is publicly accessible.');
            } else if (response.status === 404) {
                throw new Error('Google Sheets endpoint not found. Please check the server is running.');
            } else if (response.status === 400) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Invalid request: ${errorData.message || 'Please check the Google Sheets URL'}`);
            } else {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
        }
        
        const result = await response.json();
        console.log('Google Sheets response:', result);
        console.log('Data array:', result.data); // Array of records
        console.log('Record count:', result.count); // Number of records
        
        // DO NOT clear existing URLs - preserve what's already there
        // urlsList = []; // REMOVED - this was overwriting existing entries
        
        // Process the data from Google Sheets
        if (result.data && result.data.length > 0) {
            let addedCount = 0; // Track actually added entries
            const initialUrlsCount = urlsArray.length; // Store initial count for comparison
            
            result.data.forEach(record => {
                // Map Google Sheets data based on URL type
                const newEntry = {
                    isFromGoogleSheets: true // Flag to identify Google Sheets entries
                };
                
                // Add fields based on URL type configuration
                config.fields.forEach(field => {
                    if (field === 'url') {
                        newEntry[field] = record.URL || record.url || '';
                    } else if (field === 'domain') {
                        newEntry[field] = record.Domain || record.domain || '';
                    } else if (field === 'channel') {
                        newEntry[field] = record.Channel || record.channel || '';
                    } else if (field === 'platform') {
                        newEntry[field] = record.Platform || record.platform || '';
                    } else if (field === 'archiveUrl') {
                        newEntry[field] = record['Archive URL'] || record.archiveUrl || record.archive_url || '';
                    }
                });
                
                // Skip empty entries (check if all fields are empty)
                const hasContent = config.fields.some(field => newEntry[field] && newEntry[field].trim() !== '');
                if (!hasContent) {
                    console.log('Skipped empty entry');
                    return;
                }
                
                // Check for duplicates against current array
                const isDuplicate = urlsArray.some(existingEntry => 
                    config.fields.every(field => existingEntry[field] === newEntry[field])
                );
                
                if (!isDuplicate) {
                    urlsArray.push(newEntry);
                    addedCount++; // Increment only when actually added
                    console.log(`Added new ${urlType} Google Sheets entry:`, newEntry);
                } else {
                    console.log('Skipped duplicate entry:', newEntry);
                }
            });
            
            // Update the array reference
            setUrlsArray(urlType, urlsArray);
            
            // Update the UI
            updateUrlsUI(urlType);
            
            // Show success message with correct counts
            const sampleRecord = result.data[0];
            const availableFields = Object.keys(sampleRecord);
            const processedCount = result.data.length; // Total records we tried to process
            const duplicateCount = processedCount - addedCount;
            
            // Verify our math with actual list changes
            const finalUrlsCount = urlsArray.length;
            const actualAdded = finalUrlsCount - initialUrlsCount;
            
            console.log(`Debug: Initial count: ${initialUrlsCount}, Final count: ${finalUrlsCount}, Calculated added: ${addedCount}, Actual added: ${actualAdded}`);
            
            showUrlsMessage(`Added ${actualAdded} new ${urlType} records from Google Sheets (${duplicateCount} duplicates skipped). Available fields: ${availableFields.join(', ')}`, 'success', urlType);
        } else {
            showUrlsMessage(`No ${urlType} URL data found in Google Sheets`, 'warning', urlType);
        }
        
    } catch (error) {
        console.error(`Error loading ${urlType} URLs from Google Sheets:`, error);
        showUrlsMessage(`Failed to load ${urlType} URLs from Google Sheets: ${error.message}`, 'error', urlType);
    }
}

// Update UI with current URLs
function updateUrlsUI(urlType = 'trusted') {
    const config = URL_TYPES[urlType];
    const urlsArray = getUrlsArray(urlType);
    const urlsContainer = document.getElementById(config.containerId);
    
    if (urlsContainer) {
        // Always show headers and at least one entry
        let html = `
            <!-- Column Headers -->
            <div style="display: flex; gap: 10px; margin-bottom: 10px; padding: 0 15px;">
        `;
        
        // Add header columns based on configuration
        config.fieldLabels.forEach(label => {
            html += `
                <div style="flex: 1;">
                    <label style="font-size: 14px; font-weight: bold; color: #333; display: block;">${label}</label>
                </div>
            `;
        });
        
        html += `
                <div style="width: 80px;"></div> <!-- Space for remove button -->
            </div>
        `;
        
        // If no entries exist, show one empty entry
        if (urlsArray.length === 0) {
            html += `
                <div class="url-entry">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <div style="flex: 1; display: flex; gap: 10px; padding: 15px; background: ${config.backgroundColor}; border: 1px solid ${config.borderColor}; border-radius: 4px;">
            `;
            
            // Add input fields based on configuration
            config.fields.forEach((field, index) => {
                html += `
                            <div style="flex: 1;">
                                <input type="text" value="" onchange="handleEmptyEntryChange(0, '${field}', this.value, '${urlType}')" 
                                       placeholder="${config.fieldPlaceholders[index]}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                            </div>
                `;
            });
            
            html += `
                        </div>
                        <button type="button" onclick="removeEmptyEntry('${urlType}')" 
                                style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Remove
                        </button>
                    </div>
                </div>
            `;
            
        } else {
            // Show all existing entries
            html += urlsArray.map((url, index) => {
                const isFromGoogleSheets = url.isFromGoogleSheets === true;
                const backgroundColor = isFromGoogleSheets ? config.googleSheetsBackgroundColor : config.backgroundColor;
                const borderColor = isFromGoogleSheets ? config.googleSheetsBorderColor : config.borderColor;
                
                let entryHtml = `
                <div class="url-entry">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <div style="flex: 1; display: flex; gap: 10px; padding: 15px; background: ${backgroundColor}; border: 1px solid ${borderColor}; border-radius: 4px;">
                `;
                
                // Add input fields based on configuration
                config.fields.forEach((field, fieldIndex) => {
                    entryHtml += `
                            <div style="flex: 1;">
                                <input type="text" value="${url[field] || ''}" onchange="updateUrlEntry(${index}, '${field}', this.value, '${urlType}')" 
                                       placeholder="${config.fieldPlaceholders[fieldIndex]}" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                            </div>
                    `;
                });
                
                entryHtml += `
                        </div>
                        <button type="button" onclick="removeUrlFromList(${index}, '${urlType}')" 
                                style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Remove
                        </button>
                    </div>
                </div>
                `;
                
                return entryHtml;
            }).join('');
        }
        
        urlsContainer.innerHTML = html;
    }
}

// Update a specific URL entry field
function updateUrlEntry(index, field, value, urlType = 'trusted') {
    const urlsArray = getUrlsArray(urlType);
    if (index >= 0 && index < urlsArray.length) {
        urlsArray[index][field] = value;
        setUrlsArray(urlType, urlsArray);
        console.log(`Updated ${urlType} URL entry ${index} field ${field}:`, value);
    }
}

// Handle changes to the empty entry (when array is empty)
function handleEmptyEntryChange(index, field, value, urlType = 'trusted') {
    const config = URL_TYPES[urlType];
    const urlsArray = getUrlsArray(urlType);
    
    // If this is the first input in an empty list, create the first real entry
    if (urlsArray.length === 0) {
        const newEntry = {};
        
        // Initialize all fields based on configuration
        config.fields.forEach(fieldName => {
            newEntry[fieldName] = '';
        });
        
        newEntry[field] = value;
        urlsArray.unshift(newEntry); // Use unshift for consistency (though array is empty)
        setUrlsArray(urlType, urlsArray);
        updateUrlsUI(urlType); // Refresh to show as a real entry
    }
}

// Remove the empty entry (when array is empty)
function removeEmptyEntry(urlType = 'trusted') {
    // For empty entry, just clear the input fields by refreshing
    updateUrlsUI(urlType);
}

// Remove URL from list by index
function removeUrlFromList(index, urlType = 'trusted') {
    const urlsArray = getUrlsArray(urlType);
    if (index >= 0 && index < urlsArray.length) {
        const removedUrl = urlsArray.splice(index, 1)[0];
        setUrlsArray(urlType, urlsArray);
        
        // If we removed the last entry and the list is empty, we'll let updateUrlsUI() handle showing an empty entry
        updateUrlsUI(urlType);
        console.log(`Removed ${urlType} URL entry:`, removedUrl);
    }
}

// Add a new empty URL entry (generic)
function addUrlGeneric(urlType = 'trusted') {
    const config = URL_TYPES[urlType];
    const urlsArray = getUrlsArray(urlType);
    const newEntry = {};
    
    // Initialize all fields based on configuration
    config.fields.forEach(field => {
        newEntry[field] = '';
    });
    
    urlsArray.unshift(newEntry); // Insert at beginning instead of end
    setUrlsArray(urlType, urlsArray);
    updateUrlsUI(urlType);
    console.log(`Added new ${urlType} URL entry at beginning of list`);
}

// Add a new empty trusted URL entry (backwards compatibility)
function addUrl() {
    addUrlGeneric('trusted');
}

// Add a new empty malicious URL entry
function addMaliciousUrl() {
    addUrlGeneric('malicious');
}

// Show message to user
function showUrlsMessage(message, type = 'info', urlType = 'trusted') {
    const config = URL_TYPES[urlType];
    const messageContainer = document.getElementById(config.messageId);
    
    // For error and warning messages, show popup for better visibility
    if (type === 'error' || type === 'warning') {
        // Show popup alert for errors and warnings so user has time to read
        const messageType = type === 'error' ? 'Error' : 'Warning';
        alert(`${messageType}: ${message}`);
    }
    
    // Still show the temporary message in the container for all message types
    if (messageContainer) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        messageContainer.style.color = colors[type] || colors.info;
        messageContainer.textContent = message;
        messageContainer.style.display = 'block';
        
        // Hide message after 5 seconds (or longer for success messages)
        const hideDelay = type === 'success' ? 8000 : 5000;
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, hideDelay);
    }
}

// Initialize URLs management on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize both arrays with empty entries
    urlsList = [];
    maliciousUrlsList = [];
    updateUrlsUI('trusted');
    updateUrlsUI('malicious');
    
    // Add real-time validation for both Google Sheets URL inputs
    setupGoogleSheetsValidation('trusted');
    setupGoogleSheetsValidation('malicious');
});

// Setup Google Sheets URL validation for a specific URL type
function setupGoogleSheetsValidation(urlType) {
    const config = URL_TYPES[urlType];
    const googleSheetsUrlInput = document.getElementById(config.googleSheetsUrlId);
    
    if (googleSheetsUrlInput) {
        googleSheetsUrlInput.addEventListener('input', function() {
            const url = this.value.trim();
            if (url === '') {
                clearGoogleSheetsUrlError(urlType);
            } else {
                const validation = validateGoogleSheetsUrl(url);
                if (!validation.valid) {
                    showGoogleSheetsUrlError(validation.message, urlType);
                } else {
                    clearGoogleSheetsUrlError(urlType);
                }
            }
        });
        
        googleSheetsUrlInput.addEventListener('blur', function() {
            const url = this.value.trim();
            if (url !== '') {
                const validation = validateGoogleSheetsUrl(url);
                if (!validation.valid) {
                    showGoogleSheetsUrlError(validation.message, urlType);
                } else {
                    clearGoogleSheetsUrlError(urlType);
                }
            }
        });
    }
}