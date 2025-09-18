/**
 * Form Data Processing Module
 * Handles basic form data collection and narrative processing
 */

// Form Data Collection
function collectFormData() {
    // Collect inline authors
    const authors = [];
    const nameInputs = document.querySelectorAll('.author-name-input');
    const orgInputs = document.querySelectorAll('.author-org-input');
    
    for (let i = 0; i < nameInputs.length; i++) {
        const name = nameInputs[i].value.trim();
        const org = orgInputs[i].value.trim();
        if (name && org) {
            authors.push(`${name}, ${org}`);
        }
    }

    return {
        incidentNumber: document.getElementById("incidentNumber").value || "0000",
        tlpLevel: document.getElementById("tlpLevel").value || "TLP:CLEAR",
        selectedCountries: document.getElementById('country').selectedOptions,
        country: Array.from(document.getElementById('country').selectedOptions).map(option => option.value).join(', ') || "",
        title: document.getElementById("title").value || "",
        date: document.getElementById("date").value || "",
        threatActor: document.getElementById("threatActor").value || "",
        authors: authors.join('; '),
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
        subNarrativeParagraph,
        recommendationParagraph
    };
}

// Process objectives and TTPs for docx generation
function processObjectivesAndTTPs() {
    const objectivesData = [];
    const ttpsData = [];

    // Process objectives
    objectivesList.forEach((objective, index) => {
        const [id, ...titleParts] = objective.split(': ');
        const title = titleParts.join(': ');
        
        objectivesData.push({
            number: `${index + 1}`,
            id: id,
            title: title || id,
            justification: objective
        });
    });

    // Process TTPs
    ttpsList.forEach((ttp, index) => {
        const [id, ...titleParts] = ttp.split(': ');
        const title = titleParts.join(': ');
        
        ttpsData.push({
            number: `${index + 1}`,
            id: id,
            title: title || id,
            justification: ttp
        });
    });

    return {
        objectivesData,
        ttpsData
    };
}