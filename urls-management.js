/**
 * URLs Management Module
 * Handles UI updates and management of URLs from Google Sheets or manual entry
 */

// Global array to store URLs data
let urlsList = [];

// Function to load URLs from Google Sheets
async function loadUrlsFromGoogleSheets() {
    try {
        console.log('Loading URLs from Google Sheets...');
        
        // Call your new endpoint
        const response = await fetch('http://localhost:5239/google-sheets/data');
        
        // Check if the response is ok
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication required. Please check your API credentials.');
            } else if (response.status === 404) {
                throw new Error('Google Sheets endpoint not found. Please check the server is running.');
            } else {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
        }
        
        const result = await response.json();
        console.log('Google Sheets response:', result);
        console.log('Data array:', result.data); // Array of records
        console.log('Record count:', result.count); // Number of records
        
        // Clear existing URLs
        urlsList = [];
        
        // Process the data from Google Sheets
        if (result.data && result.data.length > 0) {
            result.data.forEach(record => {
                // Don't make assumptions about record structure
                // Just store the raw record data and let the user see what's available
                const urlEntry = {
                    reportUrl: '',
                    threatActor: '',
                    evidenceUrl: '',
                    authors: '',
                    platforms: '',
                    logo: '',
                    rawData: record // Store the original record for reference
                };
                urlsList.push(urlEntry);
            });
            
            // Update the UI
            updateUrlsUI();
            
            // Show success message with available fields info
            const sampleRecord = result.data[0];
            const availableFields = Object.keys(sampleRecord);
            showUrlsMessage(`Successfully loaded ${result.count} records from Google Sheets. Available fields: ${availableFields.join(', ')}`, 'success');
        } else {
            showUrlsMessage('No URL data found in Google Sheets', 'warning');
        }
        
    } catch (error) {
        console.error('Error loading URLs from Google Sheets:', error);
        showUrlsMessage('Failed to load URLs from Google Sheets. Please check your connection.', 'error');
    }
}

// Update UI with current URLs
function updateUrlsUI() {
    const urlsContainer = document.getElementById('urls-container');
    if (urlsContainer) {
        if (urlsList.length > 0) {
            urlsContainer.innerHTML = urlsList.map((url, index) => {
                // If this entry has raw data from Google Sheets, show it
                const hasRawData = url.rawData && Object.keys(url.rawData).length > 0;
                
                return `
                <div class="url-entry">
                    <label>URL Entry ${index + 1}:</label>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <div style="flex: 1; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
                            ${hasRawData ? `
                                <div style="margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 4px;">
                                    <strong>Google Sheets Data:</strong>
                                    <pre style="margin: 5px 0; font-size: 12px; background: white; padding: 8px; border-radius: 3px; overflow-x: auto;">${JSON.stringify(url.rawData, null, 2)}</pre>
                                </div>
                            ` : ''}
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <label style="font-size: 12px; color: #666; margin-bottom: 2px; display: block;">Report URL:</label>
                                    <input type="text" value="${url.reportUrl}" onchange="updateUrlEntry(${index}, 'reportUrl', this.value)" 
                                           placeholder="Report URL" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: #666; margin-bottom: 2px; display: block;">Threat Actor:</label>
                                    <input type="text" value="${url.threatActor}" onchange="updateUrlEntry(${index}, 'threatActor', this.value)" 
                                           placeholder="Russia, China etc." style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: #666; margin-bottom: 2px; display: block;">Evidence URL:</label>
                                    <input type="text" value="${url.evidenceUrl}" onchange="updateUrlEntry(${index}, 'evidenceUrl', this.value)" 
                                           placeholder="Evidence URL" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: #666; margin-bottom: 2px; display: block;">Authors:</label>
                                    <input type="text" value="${url.authors}" onchange="updateUrlEntry(${index}, 'authors', this.value)" 
                                           placeholder="Authors" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: #666; margin-bottom: 2px; display: block;">Platforms:</label>
                                    <input type="text" value="${url.platforms}" onchange="updateUrlEntry(${index}, 'platforms', this.value)" 
                                           placeholder="e.g. Facebook, X, YouTube" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: #666; margin-bottom: 2px; display: block;">Logo:</label>
                                    <input type="text" value="${url.logo}" onchange="updateUrlEntry(${index}, 'logo', this.value)" 
                                           placeholder="Logo URL or path" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                                </div>
                            </div>
                        </div>
                        <button type="button" class="remove-button" onclick="removeUrlFromList(${index})">Remove</button>
                    </div>
                </div>
                `;
            }).join('');
        } else {
            // Show empty state with option to add manual entry
            urlsContainer.innerHTML = `
                <div class="empty-urls-message" style="text-align: center; padding: 20px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;">
                    <p style="margin: 0; color: #666;">No URL entries loaded. Load from Google Sheets or add manually.</p>
                </div>
            `;
        }
    }
}

// Update a specific URL entry field
function updateUrlEntry(index, field, value) {
    if (index >= 0 && index < urlsList.length) {
        urlsList[index][field] = value;
        console.log(`Updated URL entry ${index} field ${field}:`, value);
    }
}

// Remove URL from list by index
function removeUrlFromList(index) {
    if (index >= 0 && index < urlsList.length) {
        const removedUrl = urlsList.splice(index, 1)[0];
        updateUrlsUI();
        console.log(`Removed URL entry:`, removedUrl);
    }
}

// Add a new empty URL entry
function addUrl() {
    const newEntry = {
        reportUrl: '',
        threatActor: '',
        evidenceUrl: '',
        authors: '',
        platforms: '',
        logo: ''
    };
    urlsList.push(newEntry);
    updateUrlsUI();
    console.log('Added new URL entry');
}

// Show message to user
function showUrlsMessage(message, type = 'info') {
    const messageContainer = document.getElementById('urls-message');
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
        
        // Hide message after 5 seconds
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }
}

// Initialize URLs management on page load
document.addEventListener('DOMContentLoaded', function() {
    updateUrlsUI();
});