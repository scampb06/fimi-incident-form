/**
 * Data Processing Module
 * Handles form data collection, processing, validation, and file uploads
 */

// Form Data Collection
function collectFormData() {
    return {
        incidentNumber: document.getElementById("incidentNumber").value || "0000",
        tlpLevel: document.getElementById("tlpLevel").value || "TLP:CLEAR",
        selectedCountries: document.getElementById('country').selectedOptions,
        country: Array.from(document.getElementById('country').selectedOptions).map(option => option.value).join(', ') || "",
        title: document.getElementById("title").value || "",
        date: document.getElementById("date").value || "",
        summaryIncident: document.getElementById("summary-incident").value || "",
        summaryNarrative: document.getElementById("summary-narrative").value || "",
        summaryImpact: document.getElementById("summary-impact").value || "",
        summaryTTPs: document.getElementById("summary-ttps").value || "",
        summaryRecommendations: document.getElementById("summary-recommendations").value || "",
        incident: document.getElementById("incident").value || "",
        metaNarrative: document.getElementById("metaNarrative").value || "",
        reach: document.getElementById("reach").value || "",
        outcome: document.getElementById("outcome").value || "",
        actionsTaken: document.getElementById("actionsTaken").value || ""
    };
}

// Process narratives and recommendations into docx paragraphs
function processNarratives() {
    const subNarrativeEntries = document.querySelectorAll(".sub-narrative-text");
    let subNarratives = Array.from(subNarrativeEntries)
        .map((entry, index) => `Sub-Narrative ${index + 1}: ${entry.value || ""}`)
        .join("\n");

    const subNarrativeTextRuns = subNarratives.split("\n").map(line => 
        new docx.TextRun({ 
            break: 1, 
            text: line, 
            font: "Times New Roman", 
            size: 22 
        })
    );
    const subNarrativeParagraph = new docx.Paragraph({ children: subNarrativeTextRuns });

    const recommendationEntries = document.querySelectorAll(".recommendation-text");
    let recommendations = Array.from(recommendationEntries)
        .map((entry, index) => `Recommendation ${index + 1}: ${entry.value || ""}`)
        .join("\n");

    const recommendationTextRuns = recommendations.split("\n").map(line => 
        new docx.TextRun({ 
            break: 1, 
            text: line, 
            font: "Times New Roman", 
            size: 22 
        })
    );
    const recommendationParagraph = new docx.Paragraph({ children: recommendationTextRuns });

    return {
        subNarratives,
        subNarrativeParagraph,
        recommendations,
        recommendationParagraph
    };
}

// Process objectives and TTPs if navigator file wasn't uploaded
function processObjectivesAndTTPs() {
    if (!navigatorFileUploaded) {
        // Get objectives and TTPs
        const objectiveEntries = document.querySelectorAll('.objective-entry');
        objectivesList = [];
        objectiveEntries.forEach((entry) => {
            const objTitle = entry.querySelector('.objective-title').value || '';
            const objJust = entry.querySelector('.objective-justification').value || '';
            if (objTitle.trim() !== '') {
                if (objJust.trim() !== '') {
                    objectivesList.push(`Objective: ${objTitle} - ${objJust}`);
                } else {
                    objectivesList.push(`Objective: ${objTitle}`);
                }
            }
        });

        const ttpEntries = document.querySelectorAll('.ttp-entry');
        ttpsList = [];
        ttpEntries.forEach((entry) => {
            const ttpTitle = entry.querySelector('.ttp-title').value || '';
            const ttpExpl = entry.querySelector('.ttp-explanation').value || '';
            if (ttpTitle.trim() !== '' || ttpExpl.trim() !== '') {
                ttpsList.push(`TTP: ${ttpTitle}${ttpExpl ? ' - ' + ttpExpl : ''}`);
            }
        });

        console.log("Objectives and TTPs collected successfully.");
    }
    
    return { objectivesList, ttpsList };
}

// Navigator File Upload and Processing
async function uploadNavigatorFile() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    fileInput.onchange = async function () {
        const file = fileInput.files[0];
        if (!file) return;

        try {
            const json = JSON.parse(await file.text());
            objectivesList = []; // Reset the global list
            ttpsList = [];       // Reset the global list

            for (const technique of json.techniques || []) {
                if (technique.score > 0) {
                    const title = await fetchTechniqueTitle(technique.techniqueID);
                    const justification = technique.comment || '';

                    if (['plan-strategy', 'plan-objectives'].includes(technique.tactic)) {
                        objectivesList.push(`Objective: ${title} - ${justification}`);
                    } else {
                        ttpsList.push(`TTP: ${title} - ${justification}`);
                    }
                }
            }

            // Populate the objectives and TTPs in the UI
            const objectivesContainer = document.getElementById('objectives-container');
            objectivesContainer.innerHTML = objectivesList.map(obj => `
                <div class="objective-entry">
                    <span>${obj}</span>
                </div>
            `).join('');

            const ttpsContainer = document.getElementById('ttps-container');
            ttpsContainer.innerHTML = ttpsList.map(ttp => `
                <div class="ttp-entry">
                    <span>${ttp}</span>
                </div>
            `).join('');

            // Remove the "Add TTP" button after populating
            const addTTPButton = document.getElementById('addTTPButton');
            if (addTTPButton) {
                addTTPButton.parentNode.removeChild(addTTPButton);
            }                    

            navigatorFileUploaded = true; // Mark navigator file as successfully uploaded
            alert('Navigator file processed successfully!');
        } catch (error) {
            console.error('Error processing Navigator file:', error);
            alert('Failed to process the Navigator file. Please ensure it is a valid JSON file.');
        }
    };
    fileInput.click();
}

// Interactive DISARM Framework Selection
function openDISARMFramework() {
    // Reset the global lists
    objectivesList = [];
    ttpsList = [];
    
    // Add message listener for iframe communication
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'techniqueSelected') {
            const { techniqueId, techniqueName, tactic, isObjective, selected } = event.data;
            
            if (selected) {
                // Use the tactic information from the iframe to determine categorization
                if (isObjective || tactic === 'TA01' || tactic === 'TA02') {
                    // It's an objective (from TA01 Plan Strategy or TA02 Plan Objectives)
                    if (!objectivesList.some(obj => obj.includes(techniqueId))) {
                        objectivesList.push(`${techniqueId}: ${techniqueName}`);
                        console.log('Added objective ('+tactic+'):', `${techniqueId}: ${techniqueName}`);
                    }
                } else {
                    // It's a TTP (from TA05+ columns)
                    if (!ttpsList.some(ttp => ttp.includes(techniqueId))) {
                        ttpsList.push(`${techniqueId}: ${techniqueName}`);
                        console.log('Added TTP ('+tactic+'):', `${techniqueId}: ${techniqueName}`);
                    }
                }
                updateSelectionInfo();
            } else {
                // Remove from appropriate list
                if (isObjective || tactic === 'TA01' || tactic === 'TA02') {
                    objectivesList = objectivesList.filter(obj => !obj.includes(techniqueId));
                } else {
                    ttpsList = ttpsList.filter(ttp => !ttp.includes(techniqueId));
                }
                updateSelectionInfo();
                console.log('Removed technique ('+tactic+'):', techniqueId);
            }
        }
    });
    
    // Create modal for DISARM framework
    const modal = document.createElement('div');
    modal.id = 'disarmModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.8);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        width: 95%;
        height: 90%;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
        padding: 20px;
        border-bottom: 1px solid #ccc;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f5f5f5;
    `;
    
    const headerLeft = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = 'Select DISARM Techniques';
    title.style.margin = '0 0 5px 0';
    
    const instructions = document.createElement('p');
    instructions.style.cssText = 'margin: 0; font-size: 14px; color: #666;';
    instructions.innerHTML = 'Click techniques in the framework below to add them to your report. If the framework doesn\'t load, you can <a href="https://github.com/DISARMFoundation/DISARMframeworks/blob/main/generated_files/disarm_red_framework_clickable.html" target="_blank">open it in a new tab</a>.';
    
    headerLeft.appendChild(title);
    headerLeft.appendChild(instructions);
    
    const selectionInfo = document.createElement('div');
    selectionInfo.id = 'selectionInfo';
    selectionInfo.style.cssText = `
        font-size: 16px;
        font-weight: bold;
        color: #666;
        margin: 0 20px;
        text-align: center;
    `;
    selectionInfo.textContent = 'Objectives: 0/2 | TTPs: 0/4';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Done';
    closeButton.style.cssText = `
        padding: 10px 20px;
        background: #007cba;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;
    closeButton.onclick = () => closeDISARMModal(modal);
    
    const iframe = document.createElement('iframe');
    
    // Try your own GitHub Pages hosted version first, then fallbacks
    const frameworkUrls = [
        './disarm_red_framework_clickable.html', // Local hosted version
        'https://scampb06.github.io/fimi-incident-form/disarm_red_framework_clickable.html', // Your GitHub Pages
        'https://disarmfoundation.github.io/disarm-navigator/', // DISARM Navigator fallback
    ];
    
    let currentUrlIndex = 0;
    
    function tryNextUrl() {
        if (currentUrlIndex < frameworkUrls.length) {
            iframe.src = frameworkUrls[currentUrlIndex];
            console.log(`Trying URL ${currentUrlIndex + 1}: ${frameworkUrls[currentUrlIndex]}`);
            currentUrlIndex++;
        } else {
            // All URLs failed, show manual selection only
            iframe.style.display = 'none';
            const errorMsg = document.createElement('div');
            errorMsg.style.cssText = `
                padding: 40px;
                text-align: center;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                margin: 20px;
                flex: 1;
            `;
            errorMsg.innerHTML = `
                <h3>📋 DISARM Framework Reference</h3>
                <p>The interactive framework couldn't be loaded. Please open the framework in a new tab to reference techniques.</p>
                <p><strong>Reference:</strong> <a href="https://github.com/DISARMFoundation/DISARMframeworks/blob/main/generated_files/disarm_red_framework_clickable.html" target="_blank">View DISARM Framework in new tab</a></p>
                <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 4px; text-align: left;">
                    <strong>Framework Structure:</strong><br>
                    • <strong>Objectives</strong> (columns 1-2): TA01 Plan Strategy, TA02 Plan Objectives<br>
                    • <strong>TTPs</strong> (columns 3+): TA05-TA18 (Microtarget, Develop Content, etc.)<br>
                    • Click on techniques directly in the interactive version when available
                </div>
            `;
            iframe.parentNode.replaceChild(errorMsg, iframe);
        }
    }
    
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        flex: 1;
    `;
    
    // Handle iframe load errors with timeout
    let loadTimeout;
    
    iframe.addEventListener('error', () => {
        clearTimeout(loadTimeout);
        tryNextUrl();
    });
    
    iframe.addEventListener('load', function() {
        clearTimeout(loadTimeout);
        try {
            // Check if the iframe content loaded successfully
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDoc && (iframeDoc.body.innerHTML.includes('404') || iframeDoc.body.innerHTML.includes('Not Found'))) {
                tryNextUrl();
            }
        } catch (e) {
            // Cross-origin restriction or successful load
            console.log('Framework loaded (cross-origin or success)');
        }
    });
    
    // Set a timeout for loading
    loadTimeout = setTimeout(() => {
        tryNextUrl();
    }, 5000);
    
    // Start with the first URL
    tryNextUrl();
    
    modalHeader.appendChild(headerLeft);
    modalHeader.appendChild(selectionInfo);
    modalHeader.appendChild(closeButton);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(iframe);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    console.log('DISARM Framework modal opened');
}

// Handle technique clicks from the iframe (fallback for manual input)
function handleTechniqueClick(event) {
    // This is a fallback handler - the main interaction will be through manual input
    // since we can't directly interact with the GitHub-hosted iframe content
    console.log('Message received from iframe:', event.data);
}

// Update selection information display
function updateSelectionInfo() {
    const selectionInfo = document.getElementById('selectionInfo');
    if (selectionInfo) {
        const objectivesCount = objectivesList.length;
        const ttpsCount = ttpsList.length;
        selectionInfo.textContent = `Objectives: ${objectivesCount}/2 | TTPs: ${ttpsCount}/4`;
        
        // Change color based on completion
        if (objectivesCount === 2 && ttpsCount === 4) {
            selectionInfo.style.color = '#28a745'; // Green when complete
        } else if (objectivesCount > 0 || ttpsCount > 0) {
            selectionInfo.style.color = '#007cba'; // Blue when partially complete
        } else {
            selectionInfo.style.color = '#666'; // Gray when empty
        }
    }
}

// Close DISARM modal and update UI
function closeDISARMModal(modal) {
    // Remove the modal
    document.body.removeChild(modal);
    
    // Remove the message listener
    window.removeEventListener('message', handleTechniqueClick);
    
    // Update the UI with selected objectives and TTPs
    updateObjectivesAndTTPsUI();
    
    // Mark as completed (similar to navigator file upload)
    navigatorFileUploaded = true;
    
    const totalSelected = objectivesList.length + ttpsList.length;
    if (totalSelected > 0) {
        alert(`DISARM techniques selected successfully! (${objectivesList.length} objectives, ${ttpsList.length} TTPs)`);
    } else {
        alert('No techniques were selected. You can still manually enter objectives and TTPs in the form.');
    }
    
    console.log('DISARM Framework modal closed');
}

// Update the UI with selected objectives and TTPs
function updateObjectivesAndTTPsUI() {
    // Populate the objectives in the UI
    const objectivesContainer = document.getElementById('objectives-container');
    if (objectivesContainer && objectivesList.length > 0) {
        objectivesContainer.innerHTML = objectivesList.map((obj, index) => `
            <div class="objective-entry">
                <label>Objective ${index + 1}:</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="flex: 1; padding: 8px; background: #f0f8ff; border: 1px solid #ddd; border-radius: 4px;">${obj}</span>
                    <button type="button" class="remove-button" onclick="removeObjectiveFromList(${index})">Remove</button>
                </div>
            </div>
        `).join('');
    }

    // Populate the TTPs in the UI
    const ttpsContainer = document.getElementById('ttps-container');
    if (ttpsContainer && ttpsList.length > 0) {
        ttpsContainer.innerHTML = ttpsList.map((ttp, index) => `
            <div class="ttp-entry">
                <label>TTP ${index + 1}:</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="flex: 1; padding: 8px; background: #fff5f5; border: 1px solid #ddd; border-radius: 4px;">${ttp}</span>
                    <button type="button" class="remove-button" onclick="removeTTPFromList(${index})">Remove</button>
                </div>
            </div>
        `).join('');
        
        // Remove the "Add TTP" button after populating
        const addTTPButton = document.getElementById('addTTPButton');
        if (addTTPButton) {
            addTTPButton.style.display = 'none';
        }
    }
}

// Remove objective from list by index
function removeObjectiveFromList(index) {
    if (index >= 0 && index < objectivesList.length) {
        const removedObj = objectivesList.splice(index, 1)[0];
        updateObjectivesAndTTPsUI();
        updateSelectionInfo();
        console.log(`Removed objective: ${removedObj}`);
    }
}

// Remove TTP from list by index
function removeTTPFromList(index) {
    if (index >= 0 && index < ttpsList.length) {
        const removedTTP = ttpsList.splice(index, 1)[0];
        updateObjectivesAndTTPsUI();
        updateSelectionInfo();
        console.log(`Removed TTP: ${removedTTP}`);
        
        // Show the "Add TTP" button if all TTPs are removed
        if (ttpsList.length === 0) {
            const addTTPButton = document.getElementById('addTTPButton');
            if (addTTPButton) {
                addTTPButton.style.display = 'block';
            }
        }
    }
}

// Fetch technique title from DISARM framework
async function fetchTechniqueTitle(techniqueID) {
    const url = `https://raw.githubusercontent.com/DISARMFoundation/DISARMframeworks/refs/heads/main/generated_pages/techniques/${techniqueID}.md`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const text = await response.text();
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.startsWith('# Technique ')) {
                const title = line.replace('# Technique ', '').trim(); // Extract the part after '# Technique '
                if (title) return title;
            }
        }
    } catch (error) {
        console.error(`Error fetching technique title for ${techniqueID}:`, error);
    }
    return `Technique ${techniqueID}`;
}

// URL Validation Functions
function validatereportURL(url) {
    try {
        new URL(url);
        reporturlerror.style.display = 'none';
    } catch (_) {
        reporturlerror.style.display = 'block';
        reporturlerror.textContent = 'Invalid URL. Please enter a valid URL starting with http:// or https://';
    }
}

function validateevidenceURL(url) {
    try {
        new URL(url);
        evidenceurlerror.style.display = 'none';
    } catch (_) {
        evidenceurlerror.style.display = 'block';
        evidenceurlerror.textContent = 'Invalid URL. Please enter a valid URL starting with http:// or https://';
    }
}

// Initialize URL validation listeners
function initializeURLValidation() {
    const reporturlinput = document.getElementById('reporturlInput');
    const reporturlerror = document.getElementById('reporturlError');
    let reportdebounceTimer;

    reporturlinput.addEventListener('input', () => {
        clearTimeout(reportdebounceTimer);
        reportdebounceTimer = setTimeout(() => {
            const url = reporturlinput.value.trim();
            if (url) {
                validatereportURL(url);
            } else {
                reporturlerror.style.display = 'none';
            }
        }, 500); // wait 500ms after typing stops
    });

    const evidenceurlinput = document.getElementById('evidenceurlInput');
    const evidenceurlerror = document.getElementById('evidenceurlError');
    let evidencedebounceTimer;

    evidenceurlinput.addEventListener('input', () => {
        clearTimeout(evidencedebounceTimer);
        evidencedebounceTimer = setTimeout(() => {
            const url = evidenceurlinput.value.trim();
            if (url) {
                validateevidenceURL(url);
            } else {
                evidenceurlerror.style.display = 'none';
            }
        }, 500); // wait 500ms after typing stops
    });
}