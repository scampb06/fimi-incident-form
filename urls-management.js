/**
 * URLs Management Module
 * Handles UI updates and management of URLs from Google Sheets or manual entry
 */

// Global array to store URLs data
let urlsList = [];

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
function showGoogleSheetsUrlError(message) {
    const errorDiv = document.getElementById('googleSheetsUrlError');
    const urlInput = document.getElementById('googleSheetsUrl');
    
    if (errorDiv && urlInput) {
        errorDiv.textContent = message;
        errorDiv.style.display = message ? 'block' : 'none';
        urlInput.style.borderColor = message ? '#dc3545' : '#ddd';
    }
}

// Function to clear validation error for Google Sheets URL
function clearGoogleSheetsUrlError() {
    showGoogleSheetsUrlError('');
}

// Function to load URLs from Google Sheets
async function loadUrlsFromGoogleSheets() {
    const urlInput = document.getElementById('googleSheetsUrl');
    if (!urlInput) {
        alert('Google Sheets URL input field not found');
        return;
    }
    
    const googleSheetsUrl = urlInput.value.trim();
    
    // Validate the URL
    const validation = validateGoogleSheetsUrl(googleSheetsUrl);
    if (!validation.valid) {
        showGoogleSheetsUrlError(validation.message);
        urlInput.focus();
        return;
    }
    
    // Clear any previous validation errors
    clearGoogleSheetsUrlError();
    
    // Open the interim editing window with the user-provided URL
    openGoogleSheetsEditingWindow(googleSheetsUrl);
}

// Function to open the Google Sheets editing window
function openGoogleSheetsEditingWindow(userProvidedUrl) {
    // Create the popup window similar to DISARM Framework
    const popup = window.open('', 'googleSheetsEditor', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    popup.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Add Trusted URLs</title>
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
                <h1 class="title">Add Trusted URLs</h1>
                <div style="display: flex; gap: 10px;">
                    <button class="done-button" onclick="archiveUnarchiveUrls()" style="background: #28a745;">Archive unarchived URLs</button>
                    <button class="done-button" onclick="handleDoneClick()">Done</button>
                </div>
            </div>
            
            <div class="instructions">
                Add URLs below under the column headings "URL", "Domain" and "Archive URL". Press Done when you are finished.
            </div>
            
            <div class="google-sheets-container">
                <div class="loading-message" id="loadingMessage">
                    Loading Google Sheets editor...
                </div>
                <iframe id="googleSheetsFrame" class="google-sheets-iframe" style="display: none;"></iframe>
            </div>

            <script>
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
                        // Show loading state
                        if (window.archiveButton) {
                            window.archiveButton.disabled = true;
                            window.archiveButton.textContent = 'Archiving...';
                        }
                        
                        console.log('Archiving URLs for:', window.userGoogleSheetsUrl);
                        
                        // Call the archive endpoint
                        const response = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/archive-urls?url=\${encodeURIComponent(window.userGoogleSheetsUrl)}\`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (!response.ok) {
                            if (response.status === 403) {
                                // Handle 403 permission error with guided sharing workflow
                                console.log('403 Permission error detected during archiving - showing permission helper dialog');
                                showArchivePermissionDialog(window.userGoogleSheetsUrl);
                                return; // Exit early to show the dialog instead of throwing error
                            } else {
                                throw new Error(\`Archive request failed: \${response.status} \${response.statusText}\`);
                            }
                        }
                        
                        const result = await response.json();
                        console.log('Archive response:', result);
                        
                        // Re-enable the button immediately after successful response
                        if (window.archiveButton) {
                            window.archiveButton.disabled = false;
                            window.archiveButton.textContent = 'Archive unarchived URLs';
                        }
                        
                        // Show success message to user using the correct response format
                        const totalRecords = result.totalRecords || 0;
                        const archivedCount = result.archivedCount || 0;
                        const message = result.message || 'Archive operation completed';
                        
                        alert(message + '\\n\\nTotal records processed: ' + totalRecords + '\\nURLs archived: ' + archivedCount);
                        
                    } catch (error) {
                        console.error('Error archiving URLs:', error);
                        
                        // Re-enable the button immediately after error
                        if (window.archiveButton) {
                            window.archiveButton.disabled = false;
                            window.archiveButton.textContent = 'Archive unarchived URLs';
                        }
                        
                        alert(\`Error: \${error.message}\`);
                    } finally {
                        // Final safety reset (just in case)
                        if (window.archiveButton) {
                            window.archiveButton.disabled = false;
                            window.archiveButton.textContent = 'Archive unarchived URLs';
                        }
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
                            
                            <div style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                                <p style="margin: 0; color: #856404;">
                                    <strong>⚠️ Archive Access Denied:</strong> The service needs write permission to update your Google Sheet with archive URLs.
                                </p>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="color: #333; margin-bottom: 15px;">🔗 Step 1: Share your Google Sheet with write access</h3>
                                <p style="margin-bottom: 15px; color: #666; line-height: 1.5;">
                                    Click the button below to open the sharing settings for your Google Sheet:
                                </p>
                                
                                <button onclick="openArchiveSharingSettings('\${sheetId}')" 
                                        style="background: #1a73e8; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; width: 100%; justify-content: center;">
                                    📤 Open Google Sheets Sharing Settings
                                </button>
                                
                                <div style="background: #f8f9fa; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">In the sharing dialog:</p>
                                    <ol style="margin: 0; padding-left: 20px; color: #666; line-height: 1.6;">
                                        <li>Click "Add people and groups"</li>
                                        <li>Copy and paste this email: <strong style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: monospace;">gsheets-service@spheric-baton-459622-f4.iam.gserviceaccount.com</strong></li>
                                        <li>Set permission to <strong>"Editor"</strong> (not Viewer)</li>
                                        <li>Click "Send" or "Share"</li>
                                    </ol>
                                </div>
                                
                                <button onclick="copyArchiveServiceAccountEmail()" 
                                        style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; margin: 0 auto;">
                                    📋 Copy Service Account Email
                                </button>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="color: #333; margin-bottom: 15px;">✅ Step 2: Retry archiving</h3>
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
                                    Need help? This process grants our service account write access to your Google Sheet so we can add archive URLs to your data.
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
                    
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(email).then(() => {
                            showArchiveCopyFeedback();
                        }).catch(err => {
                            console.error('Failed to copy with Clipboard API:', err);
                            fallbackArchiveCopyText(email);
                        });
                    } else {
                        fallbackArchiveCopyText(email);
                    }
                }
                
                // Fallback copy method for archive
                function fallbackArchiveCopyText(text) {
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
                            showArchiveCopyFeedback();
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
                function showArchiveCopyFeedback() {
                    const button = event.target;
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
                        button.innerHTML = '🔄 Testing and archiving...';
                        
                        // Show checking status
                        statusDiv.style.display = 'block';
                        statusDiv.style.background = '#d1ecf1';
                        statusDiv.style.color = '#0c5460';
                        statusDiv.style.border = '1px solid #bee5eb';
                        statusDiv.innerHTML = '🔍 Checking permissions and retrying archive...';
                        
                        // Call the archive endpoint again
                        const response = await fetch(\`https://fimi-incident-form-genai.azurewebsites.net/google-sheets/archive-urls?url=\${encodeURIComponent(googleSheetsUrl)}\`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (response.ok) {
                            const result = await response.json();
                            
                            // Success!
                            statusDiv.style.background = '#d4edda';
                            statusDiv.style.color = '#155724';
                            statusDiv.style.border = '1px solid #c3e6cb';
                            
                            const totalRecords = result.totalRecords || 0;
                            const archivedCount = result.archivedCount || 0;
                            const message = result.message || 'Archive operation completed';
                            
                            statusDiv.innerHTML = \`✅ Success! \${message}. Total records: \${totalRecords}, URLs archived: \${archivedCount}\`;
                            
                            // Close the permission dialog after success
                            setTimeout(() => {
                                closeArchivePermissionDialog();
                            }, 3000);
                            
                        } else if (response.status === 403) {
                            // Still no permission
                            statusDiv.style.background = '#f8d7da';
                            statusDiv.style.color = '#721c24';
                            statusDiv.style.border = '1px solid #f5c6cb';
                            statusDiv.innerHTML = '❌ Still no write access. Please make sure you shared the sheet with Editor permissions.';
                        } else {
                            // Other error
                            statusDiv.style.background = '#f8d7da';
                            statusDiv.style.color = '#721c24';
                            statusDiv.style.border = '1px solid #f5c6cb';
                            statusDiv.innerHTML = \`❌ Archive failed: \${response.status} \${response.statusText}\`;
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
                
                // Handle the Done button click
                function handleDoneClick() {
                    // Close this window and trigger the data loading in the parent
                    window.opener.loadUrlsFromGoogleSheetsData(window.userGoogleSheetsUrl);
                    window.close();
                }
                
                // Load the editor when the page loads
                window.addEventListener('load', loadGoogleSheetsEditor);
            </script>
        </body>
        </html>
    `);
    
    popup.document.close();
}

// Function to actually load the data from Google Sheets (called after editing)
async function loadUrlsFromGoogleSheetsData(googleSheetsUrl) {
    try {
        console.log('Loading URLs from Google Sheets...');
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
            const initialUrlsCount = urlsList.length; // Store initial count for comparison
            
            result.data.forEach(record => {
                // Map Google Sheets data to our three-column structure
                const newEntry = {
                    url: record.URL || record.url || '',
                    domain: record.Domain || record.domain || '',
                    archiveUrl: record['Archive URL'] || record.archiveUrl || record.archive_url || '',
                    isFromGoogleSheets: true // Flag to identify Google Sheets entries
                };
                
                // Skip empty entries
                if (!newEntry.url && !newEntry.domain && !newEntry.archiveUrl) {
                    console.log('Skipped empty entry');
                    return;
                }
                
                // Check for duplicates against current urlsList
                const isDuplicate = urlsList.some(existingEntry => 
                    existingEntry.url === newEntry.url && 
                    existingEntry.domain === newEntry.domain && 
                    existingEntry.archiveUrl === newEntry.archiveUrl
                );
                
                if (!isDuplicate) {
                    urlsList.push(newEntry);
                    addedCount++; // Increment only when actually added
                    console.log('Added new Google Sheets entry:', newEntry);
                } else {
                    console.log('Skipped duplicate entry:', newEntry);
                }
            });
            
            // Update the UI
            updateUrlsUI();
            
            // Show success message with correct counts
            const sampleRecord = result.data[0];
            const availableFields = Object.keys(sampleRecord);
            const processedCount = result.data.length; // Total records we tried to process
            const duplicateCount = processedCount - addedCount;
            
            // Verify our math with actual list changes
            const finalUrlsCount = urlsList.length;
            const actualAdded = finalUrlsCount - initialUrlsCount;
            
            console.log(`Debug: Initial count: ${initialUrlsCount}, Final count: ${finalUrlsCount}, Calculated added: ${addedCount}, Actual added: ${actualAdded}`);
            
            showUrlsMessage(`Added ${actualAdded} new records from Google Sheets (${duplicateCount} duplicates skipped). Available fields: ${availableFields.join(', ')}`, 'success');
        } else {
            showUrlsMessage('No URL data found in Google Sheets', 'warning');
        }
        
    } catch (error) {
        console.error('Error loading URLs from Google Sheets:', error);
        showUrlsMessage(`Failed to load URLs from Google Sheets: ${error.message}`, 'error');
    }
}

// Update UI with current URLs
function updateUrlsUI() {
    const urlsContainer = document.getElementById('urls-container');
    if (urlsContainer) {
        // Always show headers and at least one entry
        let html = `
            <!-- Column Headers -->
            <div style="display: flex; gap: 10px; margin-bottom: 10px; padding: 0 15px;">
                <div style="flex: 1;">
                    <label style="font-size: 14px; font-weight: bold; color: #333; display: block;">URL:</label>
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 14px; font-weight: bold; color: #333; display: block;">Domain:</label>
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 14px; font-weight: bold; color: #333; display: block;">Archive URL:</label>
                </div>
                <div style="width: 80px;"></div> <!-- Space for remove button -->
            </div>
        `;
        
        // If no entries exist, show one empty entry
        if (urlsList.length === 0) {
            html += `
                <div class="url-entry">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <div style="flex: 1; display: flex; gap: 10px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
                            <div style="flex: 1;">
                                <input type="text" value="" onchange="handleEmptyEntryChange(0, 'url', this.value)" 
                                       placeholder="https://example.com" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                            </div>
                            <div style="flex: 1;">
                                <input type="text" value="" onchange="handleEmptyEntryChange(0, 'domain', this.value)" 
                                       placeholder="example.com" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                            </div>
                            <div style="flex: 1;">
                                <input type="text" value="" onchange="handleEmptyEntryChange(0, 'archiveUrl', this.value)" 
                                       placeholder="https://archive.org/..." style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                            </div>
                        </div>
                        <button type="button" onclick="removeEmptyEntry()" 
                                style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Remove
                        </button>
                    </div>
                </div>
            `;
            
            // DO NOT automatically add to urlsList here - only add when user actually enters data
        } else {
            // Show all existing entries
            html += urlsList.map((url, index) => {
                const isFromGoogleSheets = url.isFromGoogleSheets === true;
                const backgroundColor = isFromGoogleSheets ? '#e3f2fd' : '#f9f9f9';
                const borderColor = isFromGoogleSheets ? '#90caf9' : '#ddd';
                
                return `
                <div class="url-entry">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <div style="flex: 1; display: flex; gap: 10px; padding: 15px; background: ${backgroundColor}; border: 1px solid ${borderColor}; border-radius: 4px;">
                            <div style="flex: 1;">
                                <input type="text" value="${url.url || ''}" onchange="updateUrlEntry(${index}, 'url', this.value)" 
                                       placeholder="https://example.com" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                            </div>
                            <div style="flex: 1;">
                                <input type="text" value="${url.domain || ''}" onchange="updateUrlEntry(${index}, 'domain', this.value)" 
                                       placeholder="example.com" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                            </div>
                            <div style="flex: 1;">
                                <input type="text" value="${url.archiveUrl || ''}" onchange="updateUrlEntry(${index}, 'archiveUrl', this.value)" 
                                       placeholder="https://archive.org/..." style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                            </div>
                        </div>
                        <button type="button" onclick="removeUrlFromList(${index})" 
                                style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Remove
                        </button>
                    </div>
                </div>
                `;
            }).join('');
        }
        
        urlsContainer.innerHTML = html;
    }
}

// Update a specific URL entry field
function updateUrlEntry(index, field, value) {
    if (index >= 0 && index < urlsList.length) {
        urlsList[index][field] = value;
        console.log(`Updated URL entry ${index} field ${field}:`, value);
    }
}

// Handle changes to the empty entry (when urlsList.length === 0)
function handleEmptyEntryChange(index, field, value) {
    // If this is the first input in an empty list, create the first real entry
    if (urlsList.length === 0) {
        const newEntry = {
            url: '',
            domain: '',
            archiveUrl: ''
        };
        newEntry[field] = value;
        urlsList.push(newEntry);
        updateUrlsUI(); // Refresh to show as a real entry
    }
}

// Remove the empty entry (when urlsList.length === 0)
function removeEmptyEntry() {
    // For empty entry, just clear the input fields by refreshing
    updateUrlsUI();
}

// Remove URL from list by index
function removeUrlFromList(index) {
    if (index >= 0 && index < urlsList.length) {
        const removedUrl = urlsList.splice(index, 1)[0];
        
        // If we removed the last entry and the list is empty, we'll let updateUrlsUI() handle showing an empty entry
        
        updateUrlsUI();
        console.log(`Removed URL entry:`, removedUrl);
    }
}

// Add a new empty URL entry
function addUrl() {
    const newEntry = {
        url: '',
        domain: '',
        archiveUrl: ''
    };
    urlsList.push(newEntry);
    updateUrlsUI();
    console.log('Added new URL entry');
}

// Show message to user
function showUrlsMessage(message, type = 'info') {
    const messageContainer = document.getElementById('urls-message');
    
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
    // Initialize with empty array - updateUrlsUI will show the initial empty entry
    urlsList = [];
    updateUrlsUI();
    
    // Add real-time validation for Google Sheets URL input
    const googleSheetsUrlInput = document.getElementById('googleSheetsUrl');
    if (googleSheetsUrlInput) {
        googleSheetsUrlInput.addEventListener('input', function() {
            const url = this.value.trim();
            if (url === '') {
                clearGoogleSheetsUrlError();
            } else {
                const validation = validateGoogleSheetsUrl(url);
                if (!validation.valid) {
                    showGoogleSheetsUrlError(validation.message);
                } else {
                    clearGoogleSheetsUrlError();
                }
            }
        });
        
        googleSheetsUrlInput.addEventListener('blur', function() {
            const url = this.value.trim();
            if (url !== '') {
                const validation = validateGoogleSheetsUrl(url);
                if (!validation.valid) {
                    showGoogleSheetsUrlError(validation.message);
                } else {
                    clearGoogleSheetsUrlError();
                }
            }
        });
    }
});