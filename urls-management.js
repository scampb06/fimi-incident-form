/**
 * URLs Management Module
 * Handles UI updates and management of URLs from Google Sheets or manual entry
 * Supports both Trusted URLs and Malicious URLs with Platform field
 */

// ============================================================
// Azure Configuration (imported from config.js)
// ============================================================
const urlsBaseUrl = window.AZURE_BASE_URL || `https://${window.AZURE_APP_NAME || 'fimi-incident-form-genai'}.azurewebsites.net`;
const googleSheetsServiceAccountEmail = window.GSHEETS_SERVICE_ACCOUNT_EMAIL || 'gsheets-service@spheric-baton-459622-f4.iam.gserviceaccount.com';

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

function normalizeUrlForMatching(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';

    try {
        const parsed = new URL(raw);
        parsed.hash = '';
        const normalizedPath = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');
        return `${parsed.protocol.toLowerCase()}//${parsed.host.toLowerCase()}${normalizedPath}${parsed.search}`;
    } catch (error) {
        return raw.replace(/\/$/, '').toLowerCase();
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
                        <input type="checkbox" id="preValidationCheckbox" checked style="cursor: pointer; width: 16px; height: 16px;">
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
                    <button id="checkStatusButton" onclick="checkBellingcatStatus()" style="padding: 5px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; white-space: nowrap;">Check Status</button>
                    <button id="seeAllJobsButton" onclick="showAllJobs()" style="display: none; padding: 5px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; white-space: nowrap;">See All Jobs</button>
                    <input type="text" id="urlColumnInput" placeholder="URL column header (optional)" style="display: inline-block; padding: 5px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; min-width: 200px;">
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
                        const permissionResponse = await fetch(\`${urlsBaseUrl}/google-sheets/check-permissions?url=\${encodeURIComponent(cleanUrl)}&checkWrite=true\`);
                        
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
                        
                        console.log('Permission confirmed!');
                        
                        // Get selected archive service
                        const waybackRadio = document.getElementById('waybackMachineRadio');
                        const bellingcatRadio = document.getElementById('bellingcatRadio');
                        const preValidationCheckbox = document.getElementById('preValidationCheckbox');
                        
                        // Check if Bellingcat is selected - use async endpoint without timer
                        if (bellingcatRadio && bellingcatRadio.checked) {
                            // Bellingcat Auto Archiver - use async endpoint (no URL count needed)
                            console.log('Starting Bellingcat async archive for:', cleanUrl);
                            
                            if (window.archiveButton) {
                                window.archiveButton.textContent = 'Starting archive job...';
                            }

                            const urlColumnInput = document.getElementById('urlColumnInput');
                            const urlColumnValue = urlColumnInput && urlColumnInput.value.trim() ? urlColumnInput.value.trim() : null;
                            let endpoint = \`${urlsBaseUrl}/bellingcat/auto-archiver-sheets-asynchronous?url=\${encodeURIComponent(cleanUrl)}\`;
                            if (urlColumnValue) {
                                endpoint += \`&urlColumn=\${encodeURIComponent(urlColumnValue)}\`;
                            }

                            let response;
                            try {
                                response = await fetch(endpoint, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                });
                            } catch (fetchError) {
                                if (window.archiveButton) {
                                    window.archiveButton.disabled = false;
                                    window.archiveButton.textContent = 'Archive unarchived URLs';
                                }
                                throw new Error('Network error: Unable to connect to the archive server. Please check your internet connection.');
                            }

                            // Handle non-OK responses
                            if (!response.ok) {
                                let errorMessage = \`Archive request failed (HTTP \${response.status})\`;
                                
                                try {
                                    // Try to parse the error response body
                                    const errorData = await response.json();
                                    
                                    // Check for conflict (409)
                                    if (response.status === 409) {
                                        errorMessage = errorData.message || 'A conflicting archiving job is already in progress for this sheet. Please wait for it to complete.';

                                    // Check if this is the timeout validation error
                                    } else if (response.status === 413 && errorData.detail) {
                                        const detail = errorData.detail.toLowerCase();
                                        
                                        if (detail.includes('estimated processing time') && detail.includes('exceeds')) {
                                            // This is the timeout exceeded error - set custom message
                                            errorMessage = 
                                                \`⚠️ Sheet Too Large: Your Google Sheet has too many URLs to process within the timeout limit.\n\n\` +
                                                \`\${errorData.detail}\n\n\` +
                                                \`Solutions:\n\` +
                                                \`• Split your sheet into smaller chunks (recommended)\n\` +
                                                \`• Contact your administrator to increase the timeout setting\`;
                                        } else {
                                            // Other 413 errors
                                            errorMessage = errorData.detail || errorData.message || errorMessage;
                                        }
                                    } else {
                                        // Generic error with detail from server
                                        errorMessage = errorData.detail || errorData.message || errorMessage;
                                    }
                                    
                                } catch (parseError) {
                                    // If JSON parsing fails, use generic error
                                    console.error('Failed to parse error response:', parseError);
                                }
                                
                                if (window.archiveButton) {
                                    window.archiveButton.disabled = false;
                                    window.archiveButton.textContent = 'Archive unarchived URLs';
                                }
                                
                                throw new Error(errorMessage);
                            }
                            
                            const result = await response.json();
                            console.log('Bellingcat async job started:', result);
                            
                            // Store jobId and estimated time for status checking
                            window.currentBellingcatJobId = result.jobId;
                            window.currentBellingcatEstimatedTime = result.estimatedTime || 'Unknown';
                            
                            // Re-enable the button immediately
                            if (window.archiveButton) {
                                window.archiveButton.disabled = false;
                                window.archiveButton.textContent = 'Archive unarchived URLs';
                            }
                            
                            // Show simplified job started message
                            const startTime = new Date().toLocaleString();
                            const urlCount = result.estimatedUrlCount || 'Unknown';
                            const estimatedTime = result.estimatedTime || 'Unknown';
                            
                            let message = \`Archive job started at \${startTime}. Estimated duration for \${urlCount} URLs is \${estimatedTime}. Click 'Check Status' to monitor progress.\`;
                            if (result.note) {
                                message += \`\n\${result.note}\`;
                            }
                            
                            showMessageDialog(message, 'Archive Job Started');
                            return;
                        }
                        
                        // Wayback Machine flow - use original synchronous flow with timer
                        // Step 2: Get URL count for time estimation (only for Wayback Machine)
                        console.log('Getting URL count for Wayback Machine timer...');
                        if (window.archiveButton) {
                            window.archiveButton.textContent = 'Getting URL count...';
                        }
                        
                        const countResponse = await fetch(\`${urlsBaseUrl}/google-sheets/data-for-url?url=\${encodeURIComponent(cleanUrl)}\`);
                        
                        let estimatedUrls = 0;
                        if (countResponse.ok) {
                            const countData = await countResponse.json();
                            estimatedUrls = countData.count || 0;
                            console.log('Estimated URLs to process:', estimatedUrls);
                        }
                        
                        if (window.archiveButton) {
                            window.archiveButton.textContent = 'Archiving URLs...';
                        }
                        
                        let timePerUrl = (preValidationCheckbox && preValidationCheckbox.checked) ? 2 : 1;
                        
                        // Create progress display with accurate time estimate
                        showArchiveProgress(estimatedUrls, timePerUrl);
                        
                        // Start the progress timer
                        const startTime = Date.now();
                        const progressTimer = startArchiveProgressTimer(estimatedUrls, startTime, timePerUrl);
                        
                        // Setup timeout monitoring (300% of estimated time)
                        const estimatedTotalTime = estimatedUrls * timePerUrl; // in seconds
                        const timeoutLimit = estimatedTotalTime * 3; // 300% of estimated (in seconds)
                        let hasTimedOut = false;
                        
                        const timeoutMonitor = setInterval(() => {
                            const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
                            if (elapsedTime > timeoutLimit) {
                                hasTimedOut = true;
                                clearInterval(progressTimer);
                                clearInterval(timeoutMonitor);
                                hideArchiveProgress();
                                if (window.archiveButton) {
                                    window.archiveButton.disabled = false;
                                    window.archiveButton.textContent = 'Archive unarchived URLs';
                                }
                                alert('Archive operation timed out. The call to the archive server exceeded 300% of the estimated time. Please check the archive logs and ensure the server is running properly.');
                            }
                        }, 1000);
                        
                        // Wayback Machine endpoint with preValidation parameter
                        const preValidation = preValidationCheckbox ? preValidationCheckbox.checked : false;
                        const urlColumnInput = document.getElementById('urlColumnInput');
                        const urlColumnValue = urlColumnInput && urlColumnInput.value.trim() ? urlColumnInput.value.trim() : null;
                        let endpoint = \`${urlsBaseUrl}/google-sheets/archive-urls?url=\${encodeURIComponent(cleanUrl)}&preValidation=\${preValidation}\`;
                        if (urlColumnValue) { endpoint += \`&urlColumn=\${encodeURIComponent(urlColumnValue)}\`; }
                        
                        // Call the archive endpoint
                        let response;
                        try {
                            response = await fetch(endpoint, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                        } catch (fetchError) {
                            clearInterval(progressTimer);
                            clearInterval(timeoutMonitor);
                            hideArchiveProgress();
                            if (window.archiveButton) {
                                window.archiveButton.disabled = false;
                                window.archiveButton.textContent = 'Archive unarchived URLs';
                            }
                            throw new Error('Please check that the archive server is running properly.');
                        }
                        
                        // Clear the progress timer and timeout monitor
                        clearInterval(progressTimer);
                        clearInterval(timeoutMonitor);
                        
                        // Check if we timed out
                        if (hasTimedOut) {
                            return;
                        }
                        
                        if (!response.ok) {
                            hideArchiveProgress();
                            const body = await response.json().catch(() => null);
                            if (response.status === 409) {
                                throw new Error(body?.message || 'A conflicting operation is already in progress for this sheet. Please try again shortly.');
                            }
                            const message = body?.message ?? \`Archive request failed with status \${response.status}. Please check that the archive server is running properly.\`;
                            throw new Error(message);
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
                        const permissionResponse = await fetch(\`${urlsBaseUrl}/google-sheets/check-permissions?url=\${encodeURIComponent(cleanUrl)}&checkWrite=true\`);
                        
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
                        const urlColumnInputED1 = document.getElementById('urlColumnInput');
                        const urlColumnValueED1 = urlColumnInputED1 && urlColumnInputED1.value.trim() ? urlColumnInputED1.value.trim() : null;
                        let extractDomainsUrl1 = \`${urlsBaseUrl}/google-sheets/extract-domains?url=\${encodeURIComponent(cleanUrl)}\`;
                        if (urlColumnValueED1) { extractDomainsUrl1 += \`&urlColumn=\${encodeURIComponent(urlColumnValueED1)}\`; }
                        const response = await fetch(extractDomainsUrl1, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (!response.ok) {
                            // Handle different error types
                            const errorData = await response.json().catch(() => ({}));
                            if (response.status === 409) {
                                throw new Error(errorData.message || 'A conflicting operation is already in progress for this sheet. Please try again shortly.');
                            } else if (response.status === 400) {
                                throw new Error(errorData.detail?.message || errorData.message || 'Bad request - please check the Google Sheets URL');
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
                        const permissionResponse = await fetch(\`${urlsBaseUrl}/google-sheets/check-permissions?url=\${encodeURIComponent(cleanUrl)}&checkWrite=true\`);
                        
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
                        const urlColumnInputEC1 = document.getElementById('urlColumnInput');
                        const urlColumnValueEC1 = urlColumnInputEC1 && urlColumnInputEC1.value.trim() ? urlColumnInputEC1.value.trim() : null;
                        let extractChannelsUrl1 = \`${urlsBaseUrl}/google-sheets/extract-channels?url=\${encodeURIComponent(cleanUrl)}\`;
                        if (urlColumnValueEC1) { extractChannelsUrl1 += \`&urlColumn=\${encodeURIComponent(urlColumnValueEC1)}\`; }
                        let response;
                        try {
                            response = await fetch(extractChannelsUrl1, {
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
                            const errorData = await response.json().catch(() => ({}));
                            if (response.status === 409) {
                                throw new Error(errorData.message || 'A conflicting operation is already in progress for this sheet. Please try again shortly.');
                            } else if (response.status === 404) {
                                throw new Error('Extract channels endpoint not found. The server may not have implemented the /extract-channels endpoint yet. Please contact your administrator or use the extract domains functionality instead.');
                            } else if (response.status === 400) {
                                throw new Error(errorData.detail?.message || errorData.message || 'Bad request - please check the Google Sheets URL');
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
                
                // Use window property to avoid redeclaration issues
                window.activeProgressTimer = null;
                
                // Show archive progress with timer
                function showArchiveProgress(estimatedUrls, timePerUrl) {
                    // Default timePerUrl if not provided
                    const timePerUrlDisplay = timePerUrl || 2;
                    
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
                        
                        const timePerUrlDisplay = timePerUrl || 2;
                        const estimatedTimeText = estimatedUrls > 0 ? 
                            \`Estimated: \${Math.round(estimatedUrls * timePerUrlDisplay)} seconds (\${estimatedUrls} URLs × \${timePerUrlDisplay}s each)\` : 
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
                    if (window.activeProgressTimer) {
                        clearInterval(window.activeProgressTimer);
                    }
                    
                    const averageTimePerUrl = timePerUrl || 2; // seconds (default to 2 if not provided)
                    const estimatedTotalTime = estimatedUrls * averageTimePerUrl;
                    
                    window.activeProgressTimer = setInterval(() => {
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
                    
                    return window.activeProgressTimer;
                }
                
                // Hide archive progress
                function hideArchiveProgress() {
                    // Clear the timer
                    if (window.activeProgressTimer) {
                        clearInterval(window.activeProgressTimer);
                        window.activeProgressTimer = null;
                    }
                    
                    const progressDiv = document.getElementById('archive-progress-display');
                    if (progressDiv) {
                        progressDiv.remove();
                    }
                }
                
                // Show custom message dialog (similar to permission dialog)
                function showMessageDialog(message, title = 'Archive Status', logOutput = null, options = {}) {
                    const { logUrl = null, isLive = false, onClose = null } = options;

                    // Remove any existing message dialog
                    const existing = document.getElementById('message-modal-overlay');
                    if (existing) existing.remove();

                    // Create modal overlay
                    const modalOverlay = document.createElement('div');
                    modalOverlay.id = 'message-modal-overlay';
                    modalOverlay.style.cssText = \`
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 10000;
                    \`;

                    // Create modal dialog
                    const modal = document.createElement('div');
                    modal.style.cssText = \`
                        background: white;
                        border-radius: 8px;
                        padding: 30px;
                        max-width: 500px;
                        width: 90%;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        transition: max-width 0.3s ease, width 0.3s ease;
                    \`;

                    // Create message content — IDs allow in-place update by the status poller
                    const messageDiv = document.createElement('div');
                    messageDiv.innerHTML = \`
                        <h2 id="status-dialog-title" style="margin: 0 0 20px 0; color: #333; font-size: 24px;">\${title}</h2>
                        <div id="status-message-text" style="color: #666; font-size: 16px; line-height: 1.6; white-space: pre-line; margin-bottom: 25px;">\${message}</div>
                    \`;
                    modal.appendChild(messageDiv);

                    // Create log section when there is log content or live updates are expected
                    const hasLog = logOutput !== null || isLive;
                    let logContainer = null;
                    let toggleLogButton = null;
                    let downloadLogButton = null;

                    if (hasLog) {
                        // Heading row with live indicator
                        const logHeadingDiv = document.createElement('div');
                        logHeadingDiv.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
                        logHeadingDiv.innerHTML = \`
                            <span style="font-weight:600;font-size:13px;color:#555;">Log Output</span>
                            <span id="log-live-indicator" style="display:\${isLive ? 'inline' : 'none'};color:#28a745;font-size:12px;font-weight:bold;">● Live</span>
                        \`;
                        modal.appendChild(logHeadingDiv);

                        logContainer = document.createElement('div');
                        logContainer.id = 'log-output-container';
                        logContainer.style.cssText = \`
                            display: none;
                            margin-bottom: 25px;
                            max-height: 400px;
                            overflow-y: auto;
                            background: #f5f5f5;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            padding: 15px;
                            font-family: 'Courier New', monospace;
                            font-size: 12px;
                            color: #333;
                            white-space: pre-wrap;
                            word-wrap: break-word;
                        \`;
                        logContainer.textContent = logOutput || '';
                        modal.appendChild(logContainer);
                    }

                    // Create button container
                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.cssText = 'text-align: right; display: flex; gap: 10px; justify-content: flex-end;';

                    if (hasLog) {
                        // Download Log button (initially hidden, uses live container content)
                        downloadLogButton = document.createElement('button');
                        downloadLogButton.textContent = 'Download Log';
                        downloadLogButton.style.cssText = \`
                            padding: 10px 30px;
                            background: #28a745;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                            display: none;
                        \`;
                        downloadLogButton.addEventListener('click', function() {
                            const blob = new Blob([logContainer.textContent], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = \`archive-log-\${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.txt\`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        });

                        // "View Full Logs" button — only for already-completed/failed jobs with a logUrl
                        if (logUrl && !isLive) {
                            const viewFullLogsButton = document.createElement('button');
                            viewFullLogsButton.textContent = 'View Full Logs';
                            viewFullLogsButton.style.cssText = \`
                                padding: 10px 30px;
                                background: #17a2b8;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: bold;
                            \`;
                            viewFullLogsButton.addEventListener('click', async function() {
                                viewFullLogsButton.textContent = 'Loading…';
                                viewFullLogsButton.disabled = true;
                                try {
                                    const resp = await fetch(\`${urlsBaseUrl}\${logUrl}\`);
                                    if (!resp.ok) throw new Error(\`HTTP \${resp.status}\`);
                                    logContainer.textContent = await resp.text();
                                    if (logContainer.style.display === 'none') {
                                        logContainer.style.display = 'block';
                                        if (toggleLogButton) toggleLogButton.textContent = 'Hide Log';
                                        if (downloadLogButton) downloadLogButton.style.display = 'inline-block';
                                        modal.style.maxWidth = '800px';
                                        modal.style.width = '95%';
                                    }
                                } catch (err) {
                                    logContainer.textContent = \`Error loading full logs: \${err.message}\`;
                                    logContainer.style.display = 'block';
                                } finally {
                                    viewFullLogsButton.remove();
                                }
                            });
                            buttonContainer.appendChild(viewFullLogsButton);
                        }

                        toggleLogButton = document.createElement('button');
                        toggleLogButton.textContent = 'Show Log';
                        toggleLogButton.style.cssText = \`
                            padding: 10px 30px;
                            background: #28a745;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                        \`;
                        toggleLogButton.addEventListener('click', function() {
                            if (logContainer.style.display === 'none') {
                                logContainer.style.display = 'block';
                                toggleLogButton.textContent = 'Hide Log';
                                downloadLogButton.style.display = 'inline-block';
                                modal.style.maxWidth = '800px';
                                modal.style.width = '95%';
                            } else {
                                logContainer.style.display = 'none';
                                toggleLogButton.textContent = 'Show Log';
                                downloadLogButton.style.display = 'none';
                                modal.style.maxWidth = '500px';
                                modal.style.width = '90%';
                            }
                        });

                        buttonContainer.appendChild(downloadLogButton);
                        buttonContainer.appendChild(toggleLogButton);
                    }

                    // Add OK button
                    const okButton = document.createElement('button');
                    okButton.textContent = 'OK';
                    okButton.style.cssText = \`
                        padding: 10px 30px;
                        background: #007cba;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                    \`;

                    function closeDialog() {
                        modalOverlay.remove();
                        if (onClose) onClose();
                    }

                    okButton.addEventListener('click', closeDialog);
                    buttonContainer.appendChild(okButton);
                    modal.appendChild(buttonContainer);

                    modalOverlay.appendChild(modal);
                    document.body.appendChild(modalOverlay);

                    // Close on overlay click
                    modalOverlay.addEventListener('click', function(e) {
                        if (e.target === modalOverlay) closeDialog();
                    });
                }
                
                // Helper: parse "HH:MM:SS[.fff]" duration string to whole minutes
                function parseDurationMinutes(duration) {
                    if (!duration) return 0;
                    const parts = duration.split(':');
                    if (parts.length < 3) return 0;
                    const hours = parseInt(parts[0]);
                    const minutes = parseInt(parts[1]);
                    const seconds = Math.floor(parseFloat(parts[2]));
                    return hours * 60 + minutes + Math.round(seconds / 60);
                }

                // Helper: build status message text and dialog title from a status API response
                function buildStatusInfo(status) {
                    const durationMinutes = parseDurationMinutes(status.duration);
                    const urlCount = status.urlCount || 0;
                    const startTime = new Date(status.startTime).toLocaleString();

                    let estimatedTotalMinutes = 0;
                    if (window.currentBellingcatEstimatedTime && window.currentBellingcatEstimatedTime !== 'Unknown') {
                        const timeStr = String(window.currentBellingcatEstimatedTime);
                        const firstPart = (timeStr.split(/\s+/)[0] || '');
                        const dashSplit = firstPart.split('-');
                        if (dashSplit.length >= 2) {
                            const lo = parseInt(dashSplit[0]), hi = parseInt(dashSplit[1]);
                            estimatedTotalMinutes = (!isNaN(lo) && !isNaN(hi)) ? Math.round((lo + hi) / 2) : urlCount * 3.5;
                        } else {
                            estimatedTotalMinutes = urlCount * 3.5;
                        }
                    } else {
                        estimatedTotalMinutes = urlCount * 3.5;
                    }
                    const remainingMinutes = Math.max(0, Math.round(estimatedTotalMinutes - durationMinutes));

                    let message, dialogTitle;
                    if (status.status === 'completed') {
                        message = \`Archive job started at \${startTime} completed in \${durationMinutes} minutes. ✅ Results written to Google Sheet.\`;
                        dialogTitle = 'Archive Job Completed';
                    } else if (status.status === 'running') {
                        message = \`Archive job started at \${startTime} has been running for \${durationMinutes} minutes. Remaining time estimated at \${remainingMinutes} minutes.\`;
                        dialogTitle = 'Archive Job Running';
                    } else if (status.status === 'failed') {
                        message = \`Archive job started at \${startTime} failed after \${durationMinutes} minutes. ❌ Check the server logs for details.\`;
                        dialogTitle = 'Archive Job Failed';
                    } else {
                        message = \`Archive job started at \${startTime}. Status: \${status.status}\`;
                        dialogTitle = 'Archive Job Status';
                    }
                    if (status.note) message += \`\\n\${status.note}\`;
                    return { message, dialogTitle, durationMinutes };
                }

                // Check Bellingcat job status
                async function checkBellingcatStatus() {
                    try {
                        if (!window.currentBellingcatJobId) {
                            showMessageDialog('No archive job found. Please click "Archive unarchived URLs" first to initiate archiving.', 'No Job Found');
                            return;
                        }

                        const jobId = window.currentBellingcatJobId;
                        const endpoint = \`${urlsBaseUrl}/bellingcat/auto-archiver/status/\${jobId}\`;

                        const response = await fetch(endpoint);
                        if (response.status === 404) {
                            showMessageDialog('Job not found. It may have been removed from the server.', 'Job Not Found');
                            return;
                        }
                        if (!response.ok) {
                            throw new Error(\`Status check failed with status \${response.status}\`);
                        }

                        const status = await response.json();
                        console.log('Bellingcat job status:', status);

                        const { message, dialogTitle } = buildStatusInfo(status);
                        const isActive = status.status === 'running' || status.status === 'starting';

                        // Clear any existing poll timer before opening a fresh dialog
                        if (window.bellingcatStatusPollTimer) {
                            clearInterval(window.bellingcatStatusPollTimer);
                            window.bellingcatStatusPollTimer = null;
                        }

                        showMessageDialog(message, dialogTitle, status.logOutput || null, {
                            logUrl: isActive ? null : (status.logUrl || null),
                            isLive: isActive,
                            onClose: function() {
                                if (window.bellingcatStatusPollTimer) {
                                    clearInterval(window.bellingcatStatusPollTimer);
                                    window.bellingcatStatusPollTimer = null;
                                }
                            }
                        });

                        if (isActive) {
                            window.bellingcatStatusPollTimer = setInterval(async function() {
                                try {
                                    const pollResp = await fetch(endpoint);
                                    if (!pollResp.ok) return;
                                    const pollStatus = await pollResp.json();
                                    const { message: newMsg, dialogTitle: newTitle } = buildStatusInfo(pollStatus);

                                    // Update message and title in-place
                                    const msgEl = document.getElementById('status-message-text');
                                    const titleEl = document.getElementById('status-dialog-title');
                                    const logEl = document.getElementById('log-output-container');
                                    if (msgEl) msgEl.textContent = newMsg;
                                    if (titleEl) titleEl.textContent = newTitle;
                                    if (logEl && pollStatus.logOutput) logEl.textContent = pollStatus.logOutput;

                                    const nowDone = pollStatus.status === 'completed' || pollStatus.status === 'failed';
                                    if (nowDone) {
                                        clearInterval(window.bellingcatStatusPollTimer);
                                        window.bellingcatStatusPollTimer = null;

                                        // Remove live indicator
                                        const liveEl = document.getElementById('log-live-indicator');
                                        if (liveEl) liveEl.style.display = 'none';

                                        // Fetch and display full log if available
                                        if (pollStatus.logUrl && logEl) {
                                            try {
                                                const logResp = await fetch(\`${urlsBaseUrl}\${pollStatus.logUrl}\`);
                                                if (logResp.ok) logEl.textContent = await logResp.text();
                                            } catch (e) {
                                                console.error('Failed to fetch full log:', e);
                                            }
                                        }
                                    }
                                } catch (pollErr) {
                                    console.error('Error polling Bellingcat status:', pollErr);
                                }
                            }, 12000);
                        }

                    } catch (error) {
                        console.error('Error checking Bellingcat status:', error);
                        alert(\`Error checking job status: \${error.message}\`);
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
                                        ${googleSheetsServiceAccountEmail}
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
                    const email = '${googleSheetsServiceAccountEmail}';
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
                        const permissionResponse = await fetch(\`${urlsBaseUrl}/google-sheets/check-permissions?url=\${encodeURIComponent(cleanUrl)}&checkWrite=true\`);
                        
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
                        const countResponse = await fetch(\`${urlsBaseUrl}/google-sheets/data-for-url?url=\${encodeURIComponent(cleanUrl)}\`);
                        
                        let estimatedUrls = 0;
                        if (countResponse.ok) {
                            const countData = await countResponse.json();
                            estimatedUrls = countData.count || 0;
                            console.log('Estimated URLs to process:', estimatedUrls);
                        }
                        
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
                        
                        // Show progress display with accurate time estimate
                        showArchiveProgress(estimatedUrls, timePerUrl);
                        
                        // Start the progress timer
                        const startTime = Date.now();
                        const progressTimer = startArchiveProgressTimer(estimatedUrls, startTime, timePerUrl);
                        
                        // Setup timeout monitoring (300% of estimated time)
                        const estimatedTotalTime = estimatedUrls * timePerUrl; // in seconds
                        const timeoutLimit = estimatedTotalTime * 3; // 300% of estimated (in seconds)
                        let hasTimedOut = false;
                        
                        const timeoutMonitor = setInterval(() => {
                            const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
                            if (elapsedTime > timeoutLimit) {
                                hasTimedOut = true;
                                clearInterval(progressTimer);
                                clearInterval(timeoutMonitor);
                                hideArchiveProgress();
                                statusDiv.style.display = 'block';
                                statusDiv.style.background = '#f8d7da';
                                statusDiv.style.color = '#721c24';
                                statusDiv.style.border = '1px solid #f5c6cb';
                                statusDiv.innerHTML = '⏱️ Archive operation timed out. The call to the archive server exceeded 300% of the estimated time. Please check the archive logs and ensure the server is running properly.';
                            }
                        }, 1000);
                        
                        // Determine which endpoint to use
                        let endpoint;
                        if (bellingcatRadio && bellingcatRadio.checked) {
                            // Bellingcat - no preValidation parameter
                            const urlColumnInput = document.getElementById('urlColumnInput');
                            const urlColumnValue = urlColumnInput && urlColumnInput.value.trim() ? urlColumnInput.value.trim() : null;
                            endpoint = \`${urlsBaseUrl}/bellingcat/auto-archiver-sheets-asynchronous?url=\${encodeURIComponent(cleanUrl)}\`;
                            if (urlColumnValue) {
                                endpoint += \`&urlColumn=\${encodeURIComponent(urlColumnValue)}\`;
                            }
                        } else {
                            // Wayback Machine - include preValidation parameter
                            const preValidation = preValidationCheckbox ? preValidationCheckbox.checked : false;
                            const urlColumnInput = document.getElementById('urlColumnInput');
                            const urlColumnValue = urlColumnInput && urlColumnInput.value.trim() ? urlColumnInput.value.trim() : null;
                            endpoint = \`${urlsBaseUrl}/google-sheets/archive-urls?url=\${encodeURIComponent(cleanUrl)}&preValidation=\${preValidation}\`;
                            if (urlColumnValue) { endpoint += \`&urlColumn=\${encodeURIComponent(urlColumnValue)}\`; }
                        }
                        
                        // Call the archive endpoint with cleaned URL and preValidation parameter
                        let response;
                        try {
                            response = await fetch(endpoint, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                        } catch (fetchError) {
                            clearInterval(progressTimer);
                            clearInterval(timeoutMonitor);
                            hideArchiveProgress();
                            statusDiv.style.display = 'block';
                            statusDiv.style.background = '#f8d7da';
                            statusDiv.style.color = '#721c24';
                            statusDiv.style.border = '1px solid #f5c6cb';
                            statusDiv.innerHTML = '❌ Error: Please check that the archive server is running properly.';
                            return;
                        }
                        
                        // Clear the progress timer and timeout monitor
                        clearInterval(progressTimer);
                        clearInterval(timeoutMonitor);
                        
                        // Check if we timed out
                        if (hasTimedOut) {
                            return;
                        }
                        
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
                            const body = await response.json().catch(() => null);
                            if (response.status === 409) {
                                throw new Error(body?.message || 'A conflicting operation is already in progress for this sheet. Please try again shortly.');
                            }
                            const message = body?.message ?? \`Archive request failed with status \${response.status}. Please check that the archive server is running properly.\`;
                            throw new Error(message);
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
                                        ${googleSheetsServiceAccountEmail}
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
                    const email = '${googleSheetsServiceAccountEmail}';
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
                        const permissionResponse = await fetch(\`${urlsBaseUrl}/google-sheets/check-permissions?url=\${encodeURIComponent(cleanUrl)}&checkWrite=true\`);
                        
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
                        const urlColumnInputED2 = document.getElementById('urlColumnInput');
                        const urlColumnValueED2 = urlColumnInputED2 && urlColumnInputED2.value.trim() ? urlColumnInputED2.value.trim() : null;
                        let extractDomainsUrl2 = \`${urlsBaseUrl}/google-sheets/extract-domains?url=\${encodeURIComponent(cleanUrl)}\`;
                        if (urlColumnValueED2) { extractDomainsUrl2 += \`&urlColumn=\${encodeURIComponent(urlColumnValueED2)}\`; }
                        const response = await fetch(extractDomainsUrl2, {
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
                            const errorData = await response.json().catch(() => ({}));
                            if (response.status === 409) {
                                throw new Error(errorData.message || 'A conflicting operation is already in progress for this sheet. Please try again shortly.');
                            } else if (response.status === 400) {
                                throw new Error(errorData.detail?.message || errorData.message || 'Bad request - please check the Google Sheets URL');
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
                                        ${googleSheetsServiceAccountEmail}
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
                    const email = '${googleSheetsServiceAccountEmail}';
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
                        const permissionResponse = await fetch(\`${urlsBaseUrl}/google-sheets/check-permissions?url=\${encodeURIComponent(cleanUrl)}&checkWrite=true\`);
                        
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
                        const urlColumnInputEC2 = document.getElementById('urlColumnInput');
                        const urlColumnValueEC2 = urlColumnInputEC2 && urlColumnInputEC2.value.trim() ? urlColumnInputEC2.value.trim() : null;
                        let extractChannelsUrl2 = \`${urlsBaseUrl}/google-sheets/extract-channels?url=\${encodeURIComponent(cleanUrl)}\`;
                        if (urlColumnValueEC2) { extractChannelsUrl2 += \`&urlColumn=\${encodeURIComponent(urlColumnValueEC2)}\`; }
                        let response;
                        try {
                            response = await fetch(extractChannelsUrl2, {
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
                            const errorData = await response.json().catch(() => ({}));
                            if (response.status === 409) {
                                throw new Error(errorData.message || 'A conflicting operation is already in progress for this sheet. Please try again shortly.');
                            } else if (response.status === 404) {
                                throw new Error('Extract channels endpoint not found. The server may not have implemented the /extract-channels endpoint yet. Please contact your administrator or use the extract domains functionality instead.');
                            } else if (response.status === 400) {
                                throw new Error(errorData.detail?.message || errorData.message || 'Bad request - please check the Google Sheets URL');
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
                    const urlColumnInput = document.getElementById('urlColumnInput');
                    const urlColumn = urlColumnInput && urlColumnInput.value.trim() ? urlColumnInput.value.trim() : null;
                    window.opener.loadUrlsFromGoogleSheetsData(window.userGoogleSheetsUrl, '${urlType}', urlColumn);
                    window.close();
                }
                
                // Setup archive service radio button listeners
                function setupArchiveServiceListeners() {
                    const waybackRadio = document.getElementById('waybackMachineRadio');
                    const bellingcatRadio = document.getElementById('bellingcatRadio');
                    const preValidationCheckbox = document.getElementById('preValidationCheckbox');
                    const preValidationLabel = document.getElementById('preValidationLabel');
                    const checkStatusButton = document.getElementById('checkStatusButton');
                    const seeAllJobsButton = document.getElementById('seeAllJobsButton');
                    function updateControlStates() {
                        if (bellingcatRadio && bellingcatRadio.checked) {
                            // Bellingcat selected - gray out prevalidation but keep the state
                            preValidationLabel.style.opacity = '0.4';
                            preValidationLabel.style.cursor = 'not-allowed';
                            preValidationCheckbox.style.cursor = 'not-allowed';
                            preValidationLabel.style.pointerEvents = 'none';

                            // Enable Check Status and See All Jobs buttons
                            if (checkStatusButton) {
                                checkStatusButton.disabled = false;
                                checkStatusButton.style.opacity = '1';
                                checkStatusButton.style.cursor = 'pointer';
                            }
                            if (seeAllJobsButton) {
                                seeAllJobsButton.style.display = 'inline-block';
                            }
                        } else {
                            // Wayback Machine selected - enable prevalidation
                            preValidationLabel.style.opacity = '1';
                            preValidationLabel.style.cursor = 'pointer';
                            preValidationCheckbox.style.cursor = 'pointer';
                            preValidationLabel.style.pointerEvents = 'auto';

                            // Disable Check Status button and hide See All Jobs button
                            if (checkStatusButton) {
                                checkStatusButton.disabled = true;
                                checkStatusButton.style.opacity = '0.4';
                                checkStatusButton.style.cursor = 'not-allowed';
                            }
                            if (seeAllJobsButton) {
                                seeAllJobsButton.style.display = 'none';
                            }
                        }
                    }
                    
                    if (waybackRadio) {
                        waybackRadio.addEventListener('change', updateControlStates);
                    }
                    if (bellingcatRadio) {
                        bellingcatRadio.addEventListener('change', updateControlStates);
                    }
                    
                    // Set initial state
                    updateControlStates();
                }
                
                // ── See All Jobs ──────────────────────────────────────────────
                let allJobsRefreshTimer = null;

                async function showAllJobs() {
                    // Create or reuse the overlay
                    let overlay = document.getElementById('all-jobs-overlay');
                    if (!overlay) {
                        overlay = document.createElement('div');
                        overlay.id = 'all-jobs-overlay';
                        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
                        overlay.innerHTML = \`
                            <div id="all-jobs-panel" style="background:#fff;border-radius:8px;padding:24px;width:90%;max-width:900px;max-height:85vh;display:flex;flex-direction:column;gap:12px;box-shadow:0 4px 24px rgba(0,0,0,0.3);">
                                <div style="display:flex;align-items:center;justify-content:space-between;">
                                    <h2 style="margin:0;font-size:18px;">Bellingcat Auto Archiver — All Jobs</h2>
                                    <button onclick="closeAllJobs()" style="background:none;border:none;font-size:22px;cursor:pointer;line-height:1;" title="Close">&times;</button>
                                </div>
                                <div id="all-jobs-summary" style="display:flex;gap:16px;flex-wrap:wrap;"></div>
                                <div id="all-jobs-table-wrapper" style="overflow-y:auto;flex:1;">
                                    <p style="color:#888;">Loading…</p>
                                </div>
                                <div id="all-jobs-refresh-note" style="font-size:12px;color:#888;text-align:right;"></div>
                            </div>
                        \`;
                        document.body.appendChild(overlay);
                        // Close on backdrop click
                        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeAllJobs(); });
                    }
                    await refreshAllJobs();
                }

                function closeAllJobs() {
                    if (allJobsRefreshTimer) { clearInterval(allJobsRefreshTimer); allJobsRefreshTimer = null; }
                    const overlay = document.getElementById('all-jobs-overlay');
                    if (overlay) overlay.remove();
                }

                async function refreshAllJobs() {
                    const tableWrapper = document.getElementById('all-jobs-table-wrapper');
                    const summaryDiv  = document.getElementById('all-jobs-summary');
                    const refreshNote = document.getElementById('all-jobs-refresh-note');
                    if (!tableWrapper) return;

                    let data;
                    try {
                        const resp = await fetch(\`${urlsBaseUrl}/bellingcat/auto-archiver/jobs\`);
                        if (!resp.ok) {
                            const body = await resp.json().catch(() => null);
                            throw new Error(body?.message || \`Request failed (\${resp.status})\`);
                        }
                        data = await resp.json();
                    } catch (err) {
                        tableWrapper.innerHTML = \`<p style="color:#c00;">Error loading jobs: \${err.message}</p>\`;
                        return;
                    }

                    // ── Summary chips ────────────────────────────────────────────
                    const chips = [
                        { label: 'Total',     value: data.totalJobs,     bg: '#e9ecef', fg: '#333' },
                        { label: 'Running',   value: data.runningJobs,   bg: '#cfe2ff', fg: '#084298' },
                        { label: 'Completed', value: data.completedJobs, bg: '#d1e7dd', fg: '#0a3622' },
                        { label: 'Failed',    value: data.failedJobs,    bg: '#f8d7da', fg: '#842029' },
                    ];
                    summaryDiv.innerHTML = chips.map(c =>
                        \`<span style="background:\${c.bg};color:\${c.fg};padding:6px 14px;border-radius:20px;font-weight:bold;font-size:14px;">\${c.label}: \${c.value}</span>\`
                    ).join('');

                    // ── Jobs table ───────────────────────────────────────────────
                    const statusStyle = {
                        starting:  'background:#fff3cd;color:#664d03;',
                        running:   'background:#cfe2ff;color:#084298;',
                        completed: 'background:#d1e7dd;color:#0a3622;',
                        failed:    'background:#f8d7da;color:#842029;',
                    };

                    function fmtTime(iso) {
                        if (!iso) return '—';
                        const d = new Date(iso);
                        return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
                    }

                    if (!data.jobs || data.jobs.length === 0) {
                        tableWrapper.innerHTML = '<p style="color:#888;">No jobs found.</p>';
                    } else {
                        const rows = data.jobs.map(job => {
                            const ss = statusStyle[job.status] || '';
                            const sheetUrl = \`https://docs.google.com/spreadsheets/d/\${job.spreadsheetId}\`;
                            const statusUrl = \`${urlsBaseUrl}\${job.statusUrl}\`;
                            const logLink = job.logUrl
                                ? \`<a href="${urlsBaseUrl}\${job.logUrl}" target="_blank" style="color:#0d6efd;font-size:12px;">View Logs</a>\`
                                : '—';
                            return \`<tr style="border-bottom:1px solid #dee2e6;">
                                <td style="padding:8px;white-space:nowrap;">\${fmtTime(job.startTime)}</td>
                                <td style="padding:8px;"><span style="\${ss}padding:3px 10px;border-radius:12px;font-size:12px;font-weight:bold;white-space:nowrap;">\${job.status}</span></td>
                                <td style="padding:8px;font-family:monospace;white-space:nowrap;">\${job.duration || '—'}</td>
                                <td style="padding:8px;"><a href="\${sheetUrl}" target="_blank" style="color:#0d6efd;">View Sheet</a></td>
                                <td style="padding:8px;">\${logLink}</td>
                                <td style="padding:8px;"><button onclick="viewJobDetails('\${statusUrl}', '\${job.jobId}')" style="padding:3px 10px;background:#6c757d;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Details</button></td>
                            </tr>\`;
                        }).join('');
                        tableWrapper.innerHTML = \`
                            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                                <thead>
                                    <tr style="background:#f8f9fa;text-align:left;">
                                        <th style="padding:8px;border-bottom:2px solid #dee2e6;">Start Time</th>
                                        <th style="padding:8px;border-bottom:2px solid #dee2e6;">Status</th>
                                        <th style="padding:8px;border-bottom:2px solid #dee2e6;">Duration</th>
                                        <th style="padding:8px;border-bottom:2px solid #dee2e6;">Sheet</th>
                                        <th style="padding:8px;border-bottom:2px solid #dee2e6;">Logs</th>
                                        <th style="padding:8px;border-bottom:2px solid #dee2e6;"></th>
                                    </tr>
                                </thead>
                                <tbody>\${rows}</tbody>
                            </table>
                        \`;
                    }

                    // ── Auto-refresh while jobs are active ───────────────────────
                    const hasActive = data.jobs && data.jobs.some(j => j.status === 'starting' || j.status === 'running');
                    if (hasActive) {
                        if (!allJobsRefreshTimer) {
                            allJobsRefreshTimer = setInterval(async () => {
                                if (!document.getElementById('all-jobs-overlay')) {
                                    clearInterval(allJobsRefreshTimer); allJobsRefreshTimer = null; return;
                                }
                                await refreshAllJobs();
                            }, 12000);
                        }
                        refreshNote.textContent = 'Auto-refreshing every 12 s while jobs are active.';
                    } else {
                        if (allJobsRefreshTimer) { clearInterval(allJobsRefreshTimer); allJobsRefreshTimer = null; }
                        refreshNote.textContent = '';
                    }
                }

                async function viewJobDetails(statusUrl, jobId) {
                    let detailOverlay = document.getElementById('job-detail-overlay');
                    if (detailOverlay) detailOverlay.remove();
                    detailOverlay = document.createElement('div');
                    detailOverlay.id = 'job-detail-overlay';
                    detailOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10001;display:flex;align-items:center;justify-content:center;';
                    detailOverlay.innerHTML = \`
                        <div style="background:#fff;border-radius:8px;padding:24px;width:90%;max-width:700px;max-height:80vh;display:flex;flex-direction:column;gap:12px;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
                            <div style="display:flex;align-items:center;justify-content:space-between;">
                                <h3 style="margin:0;font-size:16px;">Job Details — <span style="font-family:monospace;font-size:13px;">\${jobId}</span></h3>
                                <button onclick="document.getElementById('job-detail-overlay').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;line-height:1;" title="Close">&times;</button>
                            </div>
                            <div id="job-detail-content" style="overflow-y:auto;flex:1;"><p style="color:#888;">Loading…</p></div>
                        </div>
                    \`;
                    document.body.appendChild(detailOverlay);
                    detailOverlay.addEventListener('click', function(e) { if (e.target === detailOverlay) detailOverlay.remove(); });

                    try {
                        const resp = await fetch(statusUrl);
                        if (!resp.ok) {
                            const body = await resp.json().catch(() => null);
                            throw new Error(body?.message || \`Request failed (\${resp.status})\`);
                        }
                        const d = await resp.json();
                        const content = document.getElementById('job-detail-content');
                        const sheetUrl = d.spreadsheetId ? \`https://docs.google.com/spreadsheets/d/\${d.spreadsheetId}\` : null;
                        const fullLogUrl = d.logUrl ? \`${urlsBaseUrl}\${d.logUrl}\` : null;
                        content.innerHTML = \`
                            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                                \${[
                                    ['Job ID',       \`<span style="font-family:monospace">\${d.jobId || '—'}</span>\`],
                                    ['Status',       d.status || '—'],
                                    ['Type',         d.jobType || '—'],
                                    ['Start Time',   d.startTime ? new Date(d.startTime).toLocaleString() : '—'],
                                    ['End Time',     d.endTime   ? new Date(d.endTime).toLocaleString()   : '—'],
                                    ['Duration',     d.duration  || '—'],
                                    ['Sheet',        sheetUrl  ? \`<a href="\${sheetUrl}" target="_blank" style="color:#0d6efd;">Open Sheet</a>\` : '—'],
                                    ['Logs',         fullLogUrl ? \`<a href="\${fullLogUrl}" target="_blank" style="color:#0d6efd;">View full logs</a>\` : '—'],
                                    ['Error',        d.error     || d.errorMessage || '—'],
                                    ['Log',          d.log       || d.message      || '—'],
                                ].map(([k, v]) => \`<tr style="border-bottom:1px solid #dee2e6;">
                                    <th style="padding:8px;text-align:left;white-space:nowrap;color:#555;font-weight:600;width:120px;">\${k}</th>
                                    <td style="padding:8px;">\${v}</td>
                                </tr>\`).join('')}
                            </table>
                        \`;
                    } catch (err) {
                        document.getElementById('job-detail-content').innerHTML = \`<p style="color:#c00;">Error: \${err.message}</p>\`;
                    }
                }
                // ── End See All Jobs ──────────────────────────────────────────

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
async function loadUrlsFromGoogleSheetsData(googleSheetsUrl, urlType = 'trusted', urlColumn = null) {
    const config = URL_TYPES[urlType];
    const urlsArray = getUrlsArray(urlType);
    
    try {
        console.log(`Loading ${urlType} URLs from Google Sheets...`);
        console.log('Using URL:', googleSheetsUrl);
        
        // Call the new endpoint with the user-provided URL
        const response = await fetch(`${urlsBaseUrl}/google-sheets/data-for-url?url=${encodeURIComponent(googleSheetsUrl)}`);
        
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
            let updatedCount = 0; // Track entries updated by matching URL
            let duplicateCount = 0; // Track exact duplicates or no-op updates
            const initialUrlsCount = urlsArray.length; // Store initial count for comparison
            
            result.data.forEach(record => {
                // Map Google Sheets data based on URL type
                const newEntry = {
                    isFromGoogleSheets: true // Flag to identify Google Sheets entries
                };
                
                // Add fields based on URL type configuration
                config.fields.forEach(field => {
                    if (field === 'url') {
                        newEntry[field] = (urlColumn ? record[urlColumn] : null) || record.URL || record.url || '';
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

                // Upsert by URL: if URL already exists on form, update that row instead of creating a duplicate
                const newUrlKey = normalizeUrlForMatching(newEntry.url);
                if (newUrlKey) {
                    const existingIndex = urlsArray.findIndex(existingEntry =>
                        normalizeUrlForMatching(existingEntry.url) === newUrlKey
                    );

                    if (existingIndex >= 0) {
                        const existingEntry = urlsArray[existingIndex];
                        let changed = false;

                        config.fields.forEach(field => {
                            const incomingValue = String(newEntry[field] || '').trim();
                            if (incomingValue) {
                                if ((existingEntry[field] || '') !== newEntry[field]) {
                                    existingEntry[field] = newEntry[field];
                                    changed = true;
                                }
                            }
                        });

                        existingEntry.isFromGoogleSheets = true;

                        if (changed) {
                            updatedCount++;
                            console.log(`Updated existing ${urlType} entry by URL:`, existingEntry);
                        } else {
                            duplicateCount++;
                            console.log('Skipped URL match with no data changes:', newEntry);
                        }
                        return;
                    }
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
                    duplicateCount++;
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
            const unchangedCount = processedCount - addedCount - updatedCount;
            
            // Verify our math with actual list changes
            const finalUrlsCount = urlsArray.length;
            const actualAdded = finalUrlsCount - initialUrlsCount;
            
            console.log(`Debug: Initial count: ${initialUrlsCount}, Final count: ${finalUrlsCount}, Calculated added: ${addedCount}, Actual added: ${actualAdded}, Updated: ${updatedCount}`);
            
            showUrlsMessage(`Added ${actualAdded} new and updated ${updatedCount} existing ${urlType} records from Google Sheets (${unchangedCount} unchanged skipped). Available fields: ${availableFields.join(', ')}`, 'success', urlType);
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
