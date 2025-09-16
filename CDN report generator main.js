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

// Data collection function - extracts all form values
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

// Create header tables (top and bottom)
function generateDocument(formData, headerTopTable, headerBottomTable, summaryTable, blankPara, incidentTable, narrativeTable, impactTable, objectivesTable, recommendationsTable, footerTable) {
    return new Promise((resolve, reject) => {
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
                        headerTopTable, headerBottomTable, 
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
                const sanitizedTitle = formData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || "incident-alert";
                saveAs(blob, `cdn-incident-alert-${sanitizedTitle}.docx`);
                resolve();
            }).catch(reject);
            console.log("DOCX file generated successfully.");
        }).catch(reject);    
    });
}

function createObjectivesAndFooterTables(formData, noBorders, evidenceRows, imagelogo) {
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

    return { objectivesTable, footerTable };
}

function createContentTables(formData, noBorders) {
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
                                        text: formData.incident,
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
                                        text: `Meta-narrative: ${formData.metaNarrative}`,
                                        font: "Times New Roman",
                                        size: 22,
                                    }),
                                ],
                            }),
                            formData.subNarrativeParagraph,
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
                                        text: `Reach: ${formData.reach}`,
                                        font: "Times New Roman",
                                        size: 22,
                                    }),
                                ],
                            }),
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({
                                        text: `Outcome: ${formData.outcome}`,
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
                                        text: `Actions Taken: ${formData.actionsTaken}`,
                                        font: "Times New Roman",
                                        size: 22,
                                    }),
                                ],
                            }),
                            formData.recommendationParagraph,
                        ],
                    }),
                ],
            }),
        ],
    });

    console.log("Recommendations Table processed successfully.");

    return {
        incidentTable,
        narrativeTable,
        impactTable,
        recommendationsTable
    };
}

function createSummaryTable(formData, noBorders) {
    const table = new docx.Table({
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
                                        text: " " + formData.summaryIncident,
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
                                        text: " " + formData.summaryNarrative,
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
                                        text: " " + formData.summaryImpact,
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
                                        text: " " + formData.summaryTTPs,
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
                                        text: " " + formData.summaryRecommendations,
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
    return table;
}

function createHeaderTables(formData, noBorders) {
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
                                        text: `CDN Incident Alert: ${formData.incidentNumber}`,
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
                                        text: `${formData.tlpLevel}`, 
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
                                        text: " " + formData.country,
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
                                        text: formData.title,
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
                                        text: formData.date,
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

    console.log("Header tables processed successfully.");
    return { headerTopTable, headerBottomTable, blankPara, blankRow };
}

async function downloadAsDocx() {
    console.log("Starting the DOCX generation process...");

    try {
        // Get all form data
        const formData = collectFormData();
        const narratives = processNarratives();
        const objectives = processObjectivesAndTTPs();

        console.log("Form values collected successfully.");

        // Set border style to none for all tables
        const noBorders = {
            top: { style: docx.BorderStyle.NONE },
            bottom: { style: docx.BorderStyle.NONE },
            left: { style: docx.BorderStyle.NONE },
            right: { style: docx.BorderStyle.NONE },
            insideHorizontal: { style: docx.BorderStyle.NONE },
            insideVertical: { style: docx.BorderStyle.NONE }
        };

        // Create header tables
        const { headerTopTable, headerBottomTable, blankPara, blankRow } = createHeaderTables(formData, noBorders);

        // 2. Summary table
        const summaryTable = createSummaryTable(formData, noBorders);

        // Create content tables
        const { incidentTable, narrativeTable, impactTable, recommendationsTable } = createContentTables(formData, noBorders);

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

        // Create objectives and footer tables
        const { objectivesTable, footerTable } = createObjectivesAndFooterTables(formData, noBorders, evidenceRows, imagelogo);

        // Generate and save document
        await generateDocument(formData, headerTopTable, headerBottomTable, summaryTable, blankPara, incidentTable, narrativeTable, impactTable, objectivesTable, recommendationsTable, footerTable);    
    } catch (error) {
        console.error("Error in the DOCX generation process:", error);
        alert("An error occurred during the DOCX generation process. Please check the console for details.");
    }
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