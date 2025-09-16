// Define globally to access across the script
let objectivesList = [];
let ttpsList = [];
let imagelogo = null

// Tab functionality
function openTab(evt, tabName) {
    var i, tabContent, tabButtons;
    
    // Hide all tab content
    tabContent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }
    
    // Remove "active" class from all tab buttons
    tabButtons = document.getElementsByClassName("tab-button");
    for (i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(" active", "");
    }
    
    // Show the current tab and add "active" class to the button
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    
    // If previewing, generate the preview
    if (tabName === "preview-tab") {
        generatePreview();
    }
}

// Add TTP field
let ttpCount = 1;
function addTTP() {
    if (ttpCount >= 4) {
        alert("Maximum 4 TTPs allowed");
        return;
    }
    
    ttpCount++;
    const container = document.getElementById("ttps-container");
    const newTTP = document.createElement("div");
    newTTP.className = "ttp-entry";
    newTTP.innerHTML = `
        <label>TTP ${ttpCount}:</label>
        <input type="text" class="ttp-title" placeholder="DISARM name for TTP" title="Choose the name of a DISARM tactic or technique">
        <textarea class="ttp-explanation" placeholder="Explanation for TTP ${ttpCount}" title="Explain why you chose this TTP"></textarea>
        <button type="button" class="remove-button" onclick="removeTTP(this)">Remove</button>
    `;
    container.appendChild(newTTP);
}

// Remove TTP field
function removeTTP(button) {
    const entry = button.parentNode;
    entry.parentNode.removeChild(entry);
    ttpCount--;
    
    // Update labels
    const ttpEntries = document.querySelectorAll(".ttp-entry");
    for (let i = 0; i < ttpEntries.length; i++) {
        const label = ttpEntries[i].querySelector("label");
        label.textContent = `TTP ${i + 1}:`;
        const textarea = ttpEntries[i].querySelector("textarea");
        if (textarea) {
            textarea.placeholder = `Explanation for TTP ${i + 1}`;
        }
    }
}

// Add Observable field
let observableCount = 1;
function addObservable() {
    observableCount++;
    const container = document.getElementById("observables-container");
    const newObservable = document.createElement("div");
    newObservable.className = "observable-entry";
    newObservable.innerHTML = `
        <h3>Observable #${observableCount}</h3>
        <label for="obs-platform-${observableCount}">Platform:</label>
        <input type="text" id="obs-platform-${observableCount}" placeholder="E.g., Twitter, Facebook, Website">
        
        <label for="obs-type-${observableCount}">Type:</label>
        <select id="obs-type-${observableCount}">
            <option value="Account">Account</option>
            <option value="Website">Website</option>
            <option value="Post">Post/Content</option>
            <option value="Channel">Channel</option>
            <option value="Group">Group</option>
            <option value="Other">Other</option>
        </select>
        
        <label for="obs-identifier-${observableCount}">Identifier/URL:</label>
        <input type="text" id="obs-identifier-${observableCount}" placeholder="Account name, URL, etc.">
        
        <label for="obs-details-${observableCount}">Details/Notes:</label>
        <textarea id="obs-details-${observableCount}" placeholder="Additional details about this observable"></textarea>
        
        <label for="obs-evidence-${observableCount}">Evidence Link:</label>
        <input type="text" id="obs-evidence-${observableCount}" placeholder="Link to archived page, screenshot, etc.">
        
        <button type="button" class="remove-button" onclick="removeObservable(this)">Remove Observable</button>
    `;
    container.appendChild(newObservable);
}

// Remove Observable field
function removeObservable(button) {
    const entry = button.parentNode;
    entry.parentNode.removeChild(entry);
    observableCount--;
    
    // Update labels
    const observableEntries = document.querySelectorAll(".observable-entry");
    for (let i = 0; i < observableEntries.length; i++) {
        const heading = observableEntries[i].querySelector("h3");
        heading.textContent = `Observable #${i + 1}`;
    }
}

// Add Sub-Narrative field
let subNarrativeCount = 2; // Start from 2 since one is already present
function addSubNarrative() {
    const container = document.getElementById("subNarratives-container");
    const newSubNarrative = document.createElement("div");
    newSubNarrative.className = "sub-narrative-entry";
    newSubNarrative.innerHTML = `
        <label>Sub-Narrative ${subNarrativeCount}:</label>
        <textarea class="sub-narrative-text" placeholder="Enter sub-narrative ${subNarrativeCount}..." title="Specific sub-narrative"></textarea>
        <button type="button" class="remove-button" onclick="removeSubNarrative(this)">Remove</button>
    `;
    container.appendChild(newSubNarrative);
    subNarrativeCount++;
}

// Remove Sub-Narrative field
function removeSubNarrative(button) {
    const entry = button.parentNode;
    entry.parentNode.removeChild(entry);
    subNarrativeCount--;

    // Update labels
    const subNarrativeEntries = document.querySelectorAll(".sub-narrative-entry");
    for (let i = 0; i < subNarrativeEntries.length; i++) {
        const label = subNarrativeEntries[i].querySelector("label");
        label.textContent = `Sub-Narrative ${i + 1}:`;
        const textarea = subNarrativeEntries[i].querySelector("textarea");
        if (textarea) {
            textarea.placeholder = `Enter sub-narrative ${i + 1}...`;
        }
    }
}

// Add Recommendation field
let recommendationCount = 2; // Start from 2 since one is already present
function addRecommendation() {
    const container = document.getElementById("recommendations-container");
    const newRecommendation = document.createElement("div");
    newRecommendation.className = "recommendation-entry";
    newRecommendation.innerHTML = `
        <label>Recommendation ${recommendationCount}:</label>
        <textarea class="recommendation-text" placeholder="Enter recommendation ${recommendationCount}..." title="What further actions would you recommend?"></textarea>
        <button type="button" class="remove-button" onclick="removeRecommendation(this)">Remove</button>
    `;
    container.appendChild(newRecommendation);
    recommendationCount++;
}

// Remove Recommendation field
function removeRecommendation(button) {
    const entry = button.parentNode;
    entry.parentNode.removeChild(entry);
    recommendationCount--;

    // Update labels
    const recommendationEntries = document.querySelectorAll(".recommendation-entry");
    for (let i = 0; i < recommendationEntries.length; i++) {
        const label = recommendationEntries[i].querySelector("label");
        label.textContent = `Recommendation ${i + 1}:`;
        const textarea = recommendationEntries[i].querySelector("textarea");
        if (textarea) {
            textarea.placeholder = `Enter recommendation ${i + 1}...`;
        }
    }
}

// Generate preview of the template
let navigatorFileUploaded = false; // Track if the navigator file was uploaded successfully

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

const reporturlinput = document.getElementById('reporturlInput');
const reporturlerror = document.getElementById('reporturlError');

let reportdebounceTimer;

function validatereportURL(url) {
    try {
        new URL(url);
        reporturlerror.style.display = 'none';
    } catch (_) {
        reporturlerror.style.display = 'block';
        reporturlerror.textContent = 'Invalid URL. Please enter a valid URL starting with http:// or https://';
    }
}

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

function validateevidenceURL(url) {
    try {
        new URL(url);
        evidenceurlerror.style.display = 'none';
    } catch (_) {
        evidenceurlerror.style.display = 'block';
        evidenceurlerror.textContent = 'Invalid URL. Please enter a valid URL starting with http:// or https://';
    }
}

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

function generatePreview() {
    const previewContent = document.getElementById("preview-content");
    
    // Get values from form fields
    const incidentNumber = document.getElementById("incidentNumber").value || "0001";
    const tlpLevel = document.getElementById("tlpLevel").value;
    const country = document.getElementById("country").value || "DE";
    const title = document.getElementById("title").value || "Use the same title as the report. If no report is present, a suggestion is to use the format: Actor, doing what to who";
    const date = document.getElementById("date").value || "28/06/2024";
    
    const summary = document.getElementById("summary").value || 
        `- Summary of incident - 1-2 sentences
- Summary of narrative - 1 sentence
- Summary of impact
- Summary of DISARM TTPs
- Summary of recommendations.`;
            
    const incident = document.getElementById("incident").value || 
        "Describe the scope of what you found.";
        
    const metaNarrative = document.getElementById("metaNarrative").value || 
        "Meta narrative: Degradation of the West; Technological progress endangers public safety.";
        
    const subNarrativeEntries = document.querySelectorAll(".sub-narrative-text");
    let subNarratives = Array.from(subNarrativeEntries)
        .map((entry, index) => `Sub-Narrative ${index + 1}: ${entry.value || "[No content provided]"}`)
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
    
    const reach = document.getElementById("reach").value || "";
    const outcome = document.getElementById("outcome").value || "";
    
    const actionsTaken = document.getElementById("actionsTaken").value || 
        "Action taken (e.g. reported page to Meta, sent article to journalists, reported case to regulator):";
        
    const recommendationEntries = document.querySelectorAll(".recommendation-text");
    let recommendations = Array.from(recommendationEntries)
        .map((entry, index) => `Recommendation ${index + 1}: ${entry.value || "[No content provided]"}`)
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
    
    const threatActor = document.getElementById("threatActor").value || "Russia, China, etc.";
    const evidence = document.getElementById("evidence").value || "Reference/link to report, external document, or folder.";
    const authors = document.getElementById("authors").value || "Name, organisation";
    const platforms = document.getElementById("platforms").value || "E.g. Facebook, X, YouTube.";
    const logo = document.getElementById("logo").value;
    
    if (!navigatorFileUploaded) {
        // Collect objectives and TTPs manually if navigator file was not uploaded
        const objectiveEntries = document.querySelectorAll(".objective-entry");
        let objectivesHTML = '';
        objectiveEntries.forEach((entry, index) => {
            const title = entry.querySelector(".objective-title").value || 
                (index === 0 ? "Title of objective TTP – justification." : "Title of objective TTP – justification");
            if (title.trim() !== "") {
                objectivesHTML += `Objective: ${title}<br>`;
            }
        });

        const ttpEntries = document.querySelectorAll(".ttp-entry");
        let ttpsHTML = '';
        ttpEntries.forEach((entry, index) => {
            const explanation = entry.querySelector(".ttp-explanation").value || 
                `TTP ${index + 1} - explanation.`;
            ttpsHTML += `${explanation}<br>`;
        });

        // Append objectivesHTML and ttpsHTML to the preview
        // ...existing code to append objectivesHTML and ttpsHTML...
    }

    // Generate HTML for preview that exactly matches the Word document format
    const templateHTML = `
        <div class="preview-template" id="pdf-template">
            <table style="width: 100%; margin-bottom: 0;">
                <tr>
                    <td class="header-row" style="width: 70%; padding-left: 10px; padding-right: 0;">CDN Incident Alert: ${incidentNumber}. ${tlpLevel}</td>
                    <td class="header-row" style="width: 30%; text-align: right; padding-right: 10px;">Date<br>${date}</td>
                </tr>
            </table>
            
            <table style="width: 100%; margin-bottom: 0;">
                <tr>
                    <td class="header-row" style="width: 15%; padding-left: 10px;">Title</td>
                    <td class="header-row" style="width: 15%; text-align: left;">${country}</td>
                    <td class="header-row" style="width: 70%; padding-left: 10px; text-align: left;">${title}</td>
                </tr>
            </table>
            
            <table style="width: 100%; margin-bottom: 0;">
                <tr>
                    <td class="header-row" style="width: 100%; padding-left: 10px;">Summary</td>
                </tr>
                <tr>
                    <td style="padding: 10px; white-space: pre-line;">${summary}</td>
                </tr>
            </table>
            
            <table style="width: 100%; margin-bottom: 0;">
                <tr>
                    <td class="header-row" style="width: 100%; padding-left: 10px;">Incident</td>
                </tr>
                <tr>
                    <td style="padding: 10px; white-space: pre-wrap;">${incident}</td>
                </tr>
            </table>
            
            <table style="width: 100%; margin-bottom: 0;">
                <tr>
                    <td class="header-row" style="width: 100%; padding-left: 10px;">Narrative</td>
                </tr>
                <tr>
                    <td style="padding: 10px; white-space: pre-wrap;">${metaNarrative}<br>${subNarratives}</td>
                </tr>
            </table>
            
            <table style="width: 100%; margin-bottom: 0;">
                <tr>
                    <td class="header-row" style="width: 100%; padding-left: 10px;">Impact -</td>
                </tr>
                <tr>
                    <td style="padding: 10px;">
                        Reach: ${reach}<br>
                        Outcome: ${outcome}
                    </td>
                </tr>
            </table>
            
            <table style="width: 100%; margin-bottom: 0;">
                <tr>
                    <td class="header-row" style="width: 100%; padding-left: 10px;">Key Objectives and Behaviours</td>
                </tr>
                <tr>
                    <td style="padding: 10px; white-space: pre-wrap;">${objectivesHTML}${ttpsHTML}</td>
                </tr>
            </table>
            
            <table style="width: 100%; margin-bottom: 0;">
                <tr>
                    <td class="header-row" style="width: 100%; padding-left: 10px;">Recommendations and Actions Taken</td>
                </tr>
                <tr>
                    <td style="padding: 10px; white-space: pre-wrap;">${actionsTaken}<br>${recommendations}</td>
                </tr>
            </table>
            
            <table style="width: 100%; margin-bottom: 0; border-collapse: collapse;">
                <tr class="header-row">
                    <td style="text-align: center; padding: 10px; width: 15%;">Report</td>
                    <td style="text-align: center; padding: 10px; width: 15%;">Threat Actor</td>
                    <td style="text-align: center; padding: 10px; width: 25%;">Evidence</td>
                    <td style="text-align: center; padding: 10px; width: 15%;">Authors</td>
                    <td style="text-align: center; padding: 10px; width: 15%;">Platforms</td>
                    <td style="text-align: center; padding: 10px; width: 15%;">Logo</td>
                </tr>
                <tr>
                    <td style="text-align: center; padding: 10px;">Link</td>
                    <td style="text-align: center; padding: 10px;">${threatActor}</td>
                    <td style="text-align: left; padding: 10px; white-space: pre-wrap;">${evidence}</td>
                    <td style="text-align: center; padding: 10px;">${authors}</td>
                    <td style="text-align: center; padding: 10px;">${platforms}</td>
                    <td style="text-align: center; padding: 10px;">
                        ${logo ? `<img src="${logo}" alt="Logo" style="max-width: 100px; max-height: 50px;">` : ''}
                    </td>
                </tr>
            </table>
        </div>
    `;
    
    previewContent.innerHTML = templateHTML;
}

// --- Section header helper (blue bar, bold, underlined) ---
function sectionHeader(title) {
    return new docx.Paragraph({
        spacing: { after: 200, before: 400 },
        shading: { fill: "4472C4" },
        children: [
            new docx.TextRun({
                text: title,
                color: "FFFFFF",
                bold: true,
                underline: { type: 'single' },
                font: "Times New Roman",
                size: 22
            })
        ]
    });
}
// --- Section content helper ---
function sectionContent(text) {
    return new docx.Paragraph({
        spacing: { after: 250, before: 120 },
        children: [
            new docx.TextRun({
                text: text,
                color: "000000",
                font: "Times New Roman",
                size: 22
            })
        ]
    });
}
// --- Section content helper for bullets ---
function sectionBullets(lines) {
    return lines.filter(l => l.trim()).map(line =>
        new docx.Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100, before: 0 },
            children: [
                new docx.TextRun({
                    text: line.replace(/^[-*]\s*/, ''),
                    color: "000000",
                    font: "Times New Roman",
                    size: 22
                })
            ]
        })
    );
}

function downloadAsDocx() {
    console.log("Starting the DOCX generation process...");

    try {
        // Get values from form fields
        const incidentNumber = document.getElementById("incidentNumber").value || "0000";
        const tlpLevel = document.getElementById("tlpLevel").value || "TLP:CLEAR";
        const selectedCountries = document.getElementById('country').selectedOptions;
        const country = Array.from(selectedCountries).map(option => option.value).join(', ') || "";
        //const country = document.getElementById("country").value || "";
        const title = document.getElementById("title").value || "";
        const date = document.getElementById("date").value || "";
        const summaryIncident = document.getElementById("summary-incident").value || "";
        const summaryNarrative = document.getElementById("summary-narrative").value || "";
        const summaryImpact = document.getElementById("summary-impact").value || "";
        const summaryTTPs = document.getElementById("summary-ttps").value || "";
        const summaryRecommendations = document.getElementById("summary-recommendations").value || "";
        const incident = document.getElementById("incident").value || "";
        const metaNarrative = document.getElementById("metaNarrative").value || "";
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

        const reach = document.getElementById("reach").value || "";
        const outcome = document.getElementById("outcome").value || "";
        const actionsTaken = document.getElementById("actionsTaken").value || "";
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

        console.log("Form values collected successfully.");

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

        // Set border style to none for all tables
        const noBorders = {
            top: { style: docx.BorderStyle.NONE },
            bottom: { style: docx.BorderStyle.NONE },
            left: { style: docx.BorderStyle.NONE },
            right: { style: docx.BorderStyle.NONE },
            insideHorizontal: { style: docx.BorderStyle.NONE },
            insideVertical: { style: docx.BorderStyle.NONE }
        };

        // Split the headerGroupTable into two separate tables
        const headerTopTable = new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            columnSpan: 3,
                            width: { size: 30, type: docx.WidthType.PERCENTAGE },
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: `CDN Incident Alert: ${incidentNumber}`,
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new docx.TableCell({
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            columnSpan: 2,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: `${tlpLevel}`, 
                                            bold: false,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new docx.TableCell({
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            columnSpan: 2,
                            width: { size: 15, type: docx.WidthType.PERCENTAGE },
                            children: [
                                new docx.Paragraph({
                                    alignment: docx.AlignmentType.RIGHT,
                                    children: [
                                        new docx.TextRun({
                                            text: "Date", 
                                            bold: false,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        console.log("First Header Group Table processed successfully.");

        const blankPara = new docx.Paragraph({ text: "", spacing: { after: 0, before: 0 } });
        const blankRow = new docx.TableRow({
            children: [new docx.TableCell({ columnSpan: 8, children: [blankPara], borders: noBorders })],
        });

        const headerBottomTable = new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 1,
                            width: { size: 10, type: docx.WidthType.PERCENTAGE },
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "Title",
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new docx.TableCell({
                            columnSpan: 1,
                            width: { size: 10, type: docx.WidthType.PERCENTAGE },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: " " + country,
                                            bold: false,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new docx.TableCell({
                            columnSpan: 3,
                            width: { size: 65, type: docx.WidthType.PERCENTAGE },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: title,
                                            bold: false,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new docx.TableCell({
                            columnSpan: 3,
                            width: { size: 15, type: docx.WidthType.PERCENTAGE },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    alignment: docx.AlignmentType.RIGHT,
                                    children: [
                                        new docx.TextRun({
                                            text: date,
                                            bold: false,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                blankRow,
            ],
        });

        console.log("Second Header Group Table processed successfully.");

        // 2. Summary table
        const summaryTable = new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 8,
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "Summary",
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 2,
                            width: { size: 22, type: docx.WidthType.PERCENTAGE },
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "Incident",
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new docx.TableCell({
                            columnSpan: 6,
                            width: { size: 78, type: docx.WidthType.PERCENTAGE },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: " " + summaryIncident,
                                            bold: false,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 2,
                            width: { size: 22, type: docx.WidthType.PERCENTAGE },
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "Narrative",
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new docx.TableCell({
                            columnSpan: 6,
                            width: { size: 78, type: docx.WidthType.PERCENTAGE },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: " " + summaryNarrative,
                                            bold: false,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 2,
                            width: { size: 22, type: docx.WidthType.PERCENTAGE },
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "Impact",
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new docx.TableCell({
                            columnSpan: 6,
                            width: { size: 78, type: docx.WidthType.PERCENTAGE },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: " " + summaryImpact,
                                            bold: false,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 2,
                            width: { size: 22, type: docx.WidthType.PERCENTAGE },
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "DISARM TTPs",
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new docx.TableCell({
                            columnSpan: 6,
                            width: { size: 78, type: docx.WidthType.PERCENTAGE },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: " " + summaryTTPs,
                                            bold: false,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 2,
                            width: { size: 22, type: docx.WidthType.PERCENTAGE },
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "Recommendations",
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new docx.TableCell({
                            columnSpan: 6,
                            width: { size: 78, type: docx.WidthType.PERCENTAGE },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            verticalAlign: docx.VerticalAlign.BOTTOM,
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: " " + summaryRecommendations,
                                            bold: false,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),              
            ],
        });

        console.log("Summary Table processed successfully.");

        // Incident table
        const incidentTable = new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 3,
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "Incident",
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 3,
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: incident,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        console.log("Incident Table processed successfully.");

        // Narrative table
        const narrativeTable = new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 3,
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "Narrative",
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 3,
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: `Meta-narrative: ${metaNarrative}`,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                                subNarrativeParagraph,
                            ],
                        }),
                    ],
                }),
            ],
        });

        console.log("Narrative Table processed successfully.");

        // Impact table
        const impactTable = new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 3,
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "Impact and Outcome",
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 3,
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: `Reach: ${reach}`,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: `Outcome: ${outcome}`,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        console.log("Impact Table processed successfully.");

        // Key Objectives table
        const objectivesTable = new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 3,
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "Key Objectives and Behaviours",
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                ...objectivesList.map(obj => new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 3,
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: obj,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                })),
                ...ttpsList.map(ttp => new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 3,
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: ttp,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                })),
            ],
        });

        console.log("Key Objectives Table processed successfully.");

        // Recommendations table
        const recommendationsTable = new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 3,
                            shading: { fill: "8EAADB" },
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: "Recommendations and Actions Taken",
                                            bold: true,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            columnSpan: 3,
                            borders: noBorders,
                            margins: { top: 0, bottom: 0, left: 0, right: 0 },
                            children: [
                                new docx.Paragraph({
                                    children: [
                                        new docx.TextRun({
                                            text: `Actions Taken: ${actionsTaken}`,
                                            font: "Times New Roman",
                                            size: 22,
                                        }),
                                    ],
                                }),
                                recommendationParagraph,
                            ],
                        }),
                    ],
                }),
            ],
        });

        console.log("Recommendations Table processed successfully.");

        // Collect evidence rows
        const evidenceRows = Array.from(document.querySelectorAll('.evidence-row')).map(row => ({
            report: row.querySelector('.evidence-report-url')?.value || "",
            threat: row.querySelector('.evidence-threat')?.value || "",
            evidence: row.querySelector('.evidence-evidence-link')?.value || "",
            authors: getAuthorsString(row.querySelector('.evidence-authors') || document.createElement('div')),
            platforms: row.querySelector('.evidence-platforms')?.value || "",
            logo: row.querySelector('.evidence-logo')?.value || "",
        }));

        console.log("Evidence rows collected successfully.");

        // Build the footerTable rows
        const footerTableRows = [
            new docx.TableRow({
                children: [
                    new docx.TableCell({ width: { size: 16.6, type: docx.WidthType.PERCENTAGE }, shading: { fill: "8EAADB" }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new docx.Paragraph({ alignment: docx.AlignmentType.LEFT, children: [new docx.TextRun({ text: "Report", bold: true, font: "Times New Roman", size: 22 })] })] }),
                    new docx.TableCell({ width: { size: 16.6, type: docx.WidthType.PERCENTAGE }, shading: { fill: "8EAADB" }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new docx.Paragraph({ alignment: docx.AlignmentType.LEFT, children: [new docx.TextRun({ text: "Threat Actor", bold: true, font: "Times New Roman", size: 22 })] })] }),
                    new docx.TableCell({ width: { size: 16.7, type: docx.WidthType.PERCENTAGE }, shading: { fill: "8EAADB" }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new docx.Paragraph({ alignment: docx.AlignmentType.LEFT, children: [new docx.TextRun({ text: "Evidence", bold: true, font: "Times New Roman", size: 22 })] })] }),
                    new docx.TableCell({ width: { size: 16.7, type: docx.WidthType.PERCENTAGE }, shading: { fill: "8EAADB" }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new docx.Paragraph({ alignment: docx.AlignmentType.LEFT, children: [new docx.TextRun({ text: "Authors", bold: true, font: "Times New Roman", size: 22 })] })] }),
                    new docx.TableCell({ width: { size: 16.7, type: docx.WidthType.PERCENTAGE }, shading: { fill: "8EAADB" }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new docx.Paragraph({ alignment: docx.AlignmentType.LEFT, children: [new docx.TextRun({ text: "Platforms", bold: true, font: "Times New Roman", size: 22 })] })] }),
                    new docx.TableCell({ width: { size: 16.7, type: docx.WidthType.PERCENTAGE }, shading: { fill: "8EAADB" }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new docx.Paragraph({ alignment: docx.AlignmentType.LEFT, children: [new docx.TextRun({ text: "Logo", bold: true, font: "Times New Roman", size: 22 })] })] })
                ]
            }),
            ...evidenceRows.map(ev => new docx.TableRow({
                children: [
                    new docx.TableCell({ width: { size: 16.6, type: docx.WidthType.PERCENTAGE }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new docx.Paragraph({ alignment: docx.AlignmentType.LEFT, children: [new docx.TextRun({ text: ev.report, font: "Times New Roman", size: 22 })] })] }),
                    new docx.TableCell({ width: { size: 16.6, type: docx.WidthType.PERCENTAGE }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new docx.Paragraph({ alignment: docx.AlignmentType.LEFT, children: [new docx.TextRun({ text: ev.threat, font: "Times New Roman", size: 22 })] })] }),
                    new docx.TableCell({ width: { size: 16.7, type: docx.WidthType.PERCENTAGE }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new docx.Paragraph({ alignment: docx.AlignmentType.LEFT, children: [new docx.TextRun({ text: ev.evidence, font: "Times New Roman", size: 22 })] })] }),
                    new docx.TableCell({ width: { size: 16.7, type: docx.WidthType.PERCENTAGE }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new docx.Paragraph({ alignment: docx.AlignmentType.LEFT, children: [new docx.TextRun({ text: ev.authors, font: "Times New Roman", size: 22 })] })] }),
                    new docx.TableCell({ width: { size: 16.7, type: docx.WidthType.PERCENTAGE }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new docx.Paragraph({ alignment: docx.AlignmentType.LEFT, children: [new docx.TextRun({ text: ev.platforms, font: "Times New Roman", size: 22 })] })] }),
                    new docx.TableCell({ width: { size: 16.7, type: docx.WidthType.PERCENTAGE }, borders: noBorders, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new docx.Paragraph({ alignment: docx.AlignmentType.LEFT, children: imagelogo ? [imagelogo] : [] })] })
                ]
            }))
        ];
        const footerTable = new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: noBorders,
            rows: footerTableRows
        });

        console.log("Footer Table processed successfully.");

        async function countHtmlLines() {
            const response = await fetch(window.location.href);
            const htmlText = await response.text();
            const lineCount = htmlText.split('\n').length;
            console.log(`This HTML file has approximately ${lineCount} lines.`);
        return lineCount;
        }

        let linecount = countHtmlLines(); // linecount is a Promise
        linecount.then(count => {
            console.log(count); // count is the actual number of lines

            // Update the docx.Document children array to add blankPara after every table
            const doc = new docx.Document({
            creator: "Jesse Noort and Stephen Campbell", // This is a placeholder for the author(s) of the original HTML file 
            title: "V7", // This is a placeholder for the version of the CDN Incident Report Word Template used to create this document
            keywords: "1985", // This is a placeholder for the number of lines in the original HTML file
            revision: count, // This is a placeholder for the number of lines in the actual HTML file used to generate this document
            subject: "May 26, 2025", // This is a placeholder for the date of the original HTML file
            description: "creator: author(s) of original HTML file, title: version of CDN Incident Report Word Template, keywords: #lines in original HTML file, revision: date of original HTML file, subject: date of original HTML file, description: this explanation",
                sections: [{
                    children: [
                        headerTopTable,headerBottomTable, 
                        summaryTable, blankPara,
                        incidentTable, blankPara,
                        narrativeTable, blankPara,
                        impactTable, blankPara,
                        objectivesTable, blankPara,
                        recommendationsTable, blankPara,
                        footerTable
                    ]
                }]
            });

            console.log("DOCX document structure created successfully with blanks between tables.");

            docx.Packer.toBlob(doc).then(blob => {
                const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || "incident-alert";
                saveAs(blob, `cdn-incident-alert-${sanitizedTitle}.docx`);
            });
            console.log("DOCX file generated successfully.");
        });
    //}
        // Create the DOCX document
        //const doc = new docx.Document({
        //    sections: [{
        //        children: [
        //            new docx.Paragraph({ text: `CDN Incident Alert: ${incidentNumber}. ${tlpLevel}`, bold: true }),
        //            new docx.Paragraph({ text: `Date: ${date}` }),
        //            new docx.Paragraph({ text: `Title: ${title}` }),
        //            new docx.Paragraph({ text: `Country: ${country}` }),
        //            new docx.Paragraph({ text: "Summary:", bold: true }),
        //            new docx.Paragraph({ text: summary }),
        //            new docx.Paragraph({ text: "Incident:", bold: true }),
        //            new docx.Paragraph({ text: incident }),
        //            new docx.Paragraph({ text: "Meta Narrative:", bold: true }),
        //            new docx.Paragraph({ text: metaNarrative }),
        //            new docx.Paragraph({ text: "Sub-Narratives:", bold: true }),
        //            new docx.Paragraph({ text: subNarratives }),
        //            new docx.Paragraph({ text: "Impact and Outcome:", bold: true }),
        //            new docx.Paragraph({ text: `Reach: ${reach}` }),
        //            new docx.Paragraph({ text: `Outcome: ${outcome}` }),
        //            new docx.Paragraph({ text: "Actions Taken:", bold: true }),
        //            new docx.Paragraph({ text: actionsTaken }),
        //            new docx.Paragraph({ text: "Recommendations:", bold: true }),
        //            new docx.Paragraph({ text: recommendations }),
        //            ...objectivesList.map(obj => new docx.Paragraph({ text: obj })),
        //            ...ttpsList.map(ttp => new docx.Paragraph({ text: ttp }))
        //        ]
        //    }]
        //});

        //console.log("DOCX document structure created successfully.");

        // Generate and download the DOCX file
        //docx.Packer.toBlob(doc).then(blob => {
        //    console.log("DOCX file generated successfully.");
        //    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || "incident-alert";
        //    saveAs(blob, `cdn-incident-alert-${sanitizedTitle}.docx`);
        //    console.log("DOCX file download initiated.");
        //}).catch(error => {
        //    console.error("Error generating DOCX file:", error);
        //    alert("An error occurred while generating the DOCX file. Please check the console for details.");
        //});
    } catch (error) {
        console.error("Error in the DOCX generation process:", error);
        alert("An error occurred during the DOCX generation process. Please check the console for details.");
    }
}

// Download the template as an HTML file
function downloadTemplate() {
    // Generate the content first
    generatePreview();
    
    // Get the HTML content
    const previewContent = document.getElementById("preview-content").innerHTML;
    
    // Create a Blob with the HTML content
    const blob = new Blob([`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" width="device-width, initial-scale=1.0">
<title>CDN Incident Alert</title>
<style>
body {
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    margin: 30px;
    line-height: 1.5;
    background-color: white;
    color: black;
}
table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 0;
    border: none;
}
td {
    padding: 10px;
    vertical-align: top;
    border: none;
}
.header-row {
    background-color: #4472C4;
    color: white;
    font-weight: bold;
}
a {
    color: white;
}
.preview-template {
    max-width: 800px;
    margin: 0 auto;
}
@media print {
    body {
        margin: 0;
        padding: 20px;
        background-color: white;
        color: black;
    }
    .header-row {
        background-color: #4472C4 !important;
        color: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    a {
        color: white !important;
    }
}
</style>
</head>
<body>
${previewContent}
</body>
</html>`], { type: 'text/html' });
    
    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Set the filename
    const title = document.getElementById("title").value || "incident-alert";
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    link.download = `cdn-incident-alert-${sanitizedTitle}.html`;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download the observables spreadsheet as a CSV file
function downloadObservables() {
    const observableEntries = document.querySelectorAll(".observable-entry");
    let csvContent = "Platform,Type,Identifier/URL,Details/Notes,Evidence Link\n";
    
    observableEntries.forEach((entry, index) => {
        const platform = document.getElementById(`obs-platform-${index + 1}`).value || "";
        const type = document.getElementById(`obs-type-${index + 1}`).value || "";
        const identifier = document.getElementById(`obs-identifier-${index + 1}`).value || "";
        const details = document.getElementById(`obs-details-${index + 1}`).value || "";
        const evidence = document.getElementById(`obs-evidence-${index + 1}`).value || "";
        
        // Escape any commas and quotes in the fields
        const escapedDetails = details.replace(/"/g, '""').replace(/\n/g, ' ');
        const escapedIdentifier = identifier.replace(/"/g, '""');
        
        csvContent += `"${platform}","${type}","${escapedIdentifier}","${escapedDetails}","${evidence}"\n`;
    });
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv' });
    
    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Set the filename
    const title = document.getElementById("title").value || "incident";
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    link.download = `observables-${sanitizedTitle}.csv`;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

let authorCallback = null;

function openAuthorModal(callback) {
    document.getElementById('modalAuthorName').value = '';
    document.getElementById('modalAuthorOrg').value = '';
    document.getElementById('authorModal').style.display = 'block';
    authorCallback = callback;
}

function closeAuthorModal() {
    document.getElementById('authorModal').style.display = 'none';
    authorCallback = null;
}

function submitAuthorModal() {
    const name = document.getElementById('modalAuthorName').value.trim();
    const org = document.getElementById('modalAuthorOrg').value.trim();
    if (authorCallback) authorCallback(name, org);
    closeAuthorModal();
}

function addAuthor(button) {
    const authorsDiv = button.parentNode.parentNode.querySelector('.evidence-authors');
    openAuthorModal(function(name, org) {
        if (name && org) {
            const newAuthorSpan = document.createElement('span');
            newAuthorSpan.className = 'author-name';
            newAuthorSpan.textContent = `${name}, ${org} `;
            //  Add a remove button for this author
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.className = 'remove-author';
            removeBtn.onclick = function() {
                // Remove both the author and its following <br>
                if (newAuthorSpan.nextSibling && newAuthorSpan.nextSibling.tagName === 'BR') {
                    authorsDiv.removeChild(newAuthorSpan.nextSibling);
                }
                authorsDiv.removeChild(newAuthorSpan);
            };  
            newAuthorSpan.appendChild(removeBtn);
            authorsDiv.appendChild(newAuthorSpan); 
            // Add a line break after each author
            authorsDiv.appendChild(document.createElement('br'));                    
        }
    });
}

function removeAuthor(button) {
    const authorsCell = button.parentNode.parentNode.querySelector('.evidence-authors');
    const authors = authorsCell.value.split(';').map(author => author.trim());
    const authorToRemove = button.parentNode.querySelector('.author-name').textContent;
    const updatedAuthors = authors.filter(author => author !== authorToRemove);
    authorsCell.value = updatedAuthors.join('; ');
}

// Get all authors as a string for the Word document

function getAuthorsString(authorsDiv) {
    return Array.from(authorsDiv.querySelectorAll('.author-name'))
        .map(span => span.childNodes[0].textContent.trim())
        .join('; ');
}

function triggerFilePicker() {
    document.getElementById('logoFileInput').click();
}

// Upload an image to populate the Logo cell (alternative code)
async function previewImage(event) {
    const input = event.target;
    const file = input.files[0];
    const messageDiv = document.getElementById("logo-message");

    // Check MIME types supported by Word
    const allowedTypes = ["image/jpeg", "image/png", "image/bmp", "image/gif"];
    if (!file || !allowedTypes.includes(file.type)) {
        console.log("File is invalid or type not allowed");
        messageDiv.textContent = "Please upload a JPEG, PNG, BMP, or GIF image.";
        return;
    }

    // Clear logo-message after successful validation
    messageDiv.textContent = "";
    
    const arrayBuffer = await file.arrayBuffer();

    // Create a FileReader to read the file
    const reader = new FileReader();
    reader.onload = function (e) {
        // Create an image element to preview the uploaded image
        const img = document.getElementById("imagePreview");
        img.src = e.target.result;

        // Create a temporary image to get dimensions and maintain aspect ratio                
        const tempImg = new window.Image();
        tempImg.onload = function() {
            const scale = 0.5; // Adjust the scale as needed
            imagelogo = new docx.ImageRun({
                data: arrayBuffer,
                transformation: {
                    width: tempImg.width * scale,
                    height: tempImg.height * scale
                },
            });
        };
        tempImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

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