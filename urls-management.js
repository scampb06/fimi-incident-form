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
        
        // DO NOT clear existing URLs - preserve what's already there
        // urlsList = []; // REMOVED - this was overwriting existing entries
        
        // Process the data from Google Sheets
        if (result.data && result.data.length > 0) {
            result.data.forEach(record => {
                // Map Google Sheets data to our three-column structure
                const newEntry = {
                    url: record.URL || record.url || '',
                    domain: record.Domain || record.domain || '',
                    archiveUrl: record['Archive URL'] || record.archiveUrl || record.archive_url || '',
                    isFromGoogleSheets: true // Flag to identify Google Sheets entries
                };
                
                // Check for duplicates before adding
                const isDuplicate = urlsList.some(existingEntry => 
                    existingEntry.url === newEntry.url && 
                    existingEntry.domain === newEntry.domain && 
                    existingEntry.archiveUrl === newEntry.archiveUrl
                );
                
                if (!isDuplicate) {
                    urlsList.push(newEntry);
                    console.log('Added new Google Sheets entry:', newEntry);
                } else {
                    console.log('Skipped duplicate entry:', newEntry);
                }
            });
            
            // Update the UI
            updateUrlsUI();
            
            // Show success message with available fields info
            const sampleRecord = result.data[0];
            const availableFields = Object.keys(sampleRecord);
            const addedCount = result.data.length - result.data.filter(record => {
                const entry = {
                    url: record.URL || record.url || '',
                    domain: record.Domain || record.domain || '',
                    archiveUrl: record['Archive URL'] || record.archiveUrl || record.archive_url || ''
                };
                return urlsList.some(existingEntry => 
                    existingEntry.url === entry.url && 
                    existingEntry.domain === entry.domain && 
                    existingEntry.archiveUrl === entry.archiveUrl
                );
            }).length;
            
            showUrlsMessage(`Added ${addedCount} new records from Google Sheets (${result.count - addedCount} duplicates skipped). Available fields: ${availableFields.join(', ')}`, 'success');
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
    // Initialize with empty array - updateUrlsUI will show the initial empty entry
    urlsList = [];
    updateUrlsUI();
});