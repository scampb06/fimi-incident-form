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
                // Map Google Sheets data to our three-column structure
                const urlEntry = {
                    url: record.URL || record.url || '',
                    domain: record.Domain || record.domain || '',
                    archiveUrl: record['Archive URL'] || record.archiveUrl || record.archive_url || '',
                    isFromGoogleSheets: true // Flag to identify Google Sheets entries
                };
                urlsList.push(urlEntry);
                console.log('Processed Google Sheets entry:', urlEntry);
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
                // Check if this entry is from Google Sheets
                const isFromGoogleSheets = url.isFromGoogleSheets === true;
                
                if (isFromGoogleSheets) {
                    // Show Google Sheets data using the same three-column layout
                    return `
                    <div class="url-entry">
                        <label>Record ${index + 1}:</label>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <div style="flex: 1; display: flex; gap: 10px; padding: 15px; background: #e3f2fd; border: 1px solid #90caf9; border-radius: 4px;">
                                <div style="flex: 1;">
                                    <label style="font-size: 12px; color: #666; margin-bottom: 2px; display: block;">URL:</label>
                                    <input type="text" value="${url.url || ''}" onchange="updateUrlEntry(${index}, 'url', this.value)" 
                                           placeholder="https://example.com" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                                </div>
                                <div style="flex: 1;">
                                    <label style="font-size: 12px; color: #666; margin-bottom: 2px; display: block;">Domain:</label>
                                    <input type="text" value="${url.domain || ''}" onchange="updateUrlEntry(${index}, 'domain', this.value)" 
                                           placeholder="example.com" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                                </div>
                                <div style="flex: 1;">
                                    <label style="font-size: 12px; color: #666; margin-bottom: 2px; display: block;">Archive URL:</label>
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
                } else {
                    // Show manual entry form for entries without raw data
                    return `
                    <div class="url-entry">
                        <label>URL Entry ${index + 1}:</label>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <div style="flex: 1; display: flex; gap: 10px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
                                <div style="flex: 1;">
                                    <label style="font-size: 12px; color: #666; margin-bottom: 2px; display: block;">URL:</label>
                                    <input type="text" value="${url.url || ''}" onchange="updateUrlEntry(${index}, 'url', this.value)" 
                                           placeholder="https://example.com" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                                </div>
                                <div style="flex: 1;">
                                    <label style="font-size: 12px; color: #666; margin-bottom: 2px; display: block;">Domain:</label>
                                    <input type="text" value="${url.domain || ''}" onchange="updateUrlEntry(${index}, 'domain', this.value)" 
                                           placeholder="example.com" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                                </div>
                                <div style="flex: 1;">
                                    <label style="font-size: 12px; color: #666; margin-bottom: 2px; display: block;">Archive URL:</label>
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
                }
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