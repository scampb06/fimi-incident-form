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

    // Helper function to safely get element value
    function safeGetValue(elementId, defaultValue = "") {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element with ID '${elementId}' not found`);
            return defaultValue;
        }
        return element.value || defaultValue;
    }

    // Helper function to safely get selected options
    function safeGetSelectedOptions(elementId, defaultValue = "") {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element with ID '${elementId}' not found`);
            return defaultValue;
        }
        if (!element.selectedOptions) {
            console.warn(`Element with ID '${elementId}' has no selectedOptions property`);
            return defaultValue;
        }
        return Array.from(element.selectedOptions).map(option => option.value).join(', ') || defaultValue;
    }

    return {
        incidentNumber: safeGetValue("incidentNumber", "0000"),
        tlpLevel: safeGetValue("tlpLevel", "TLP:CLEAR"),
        selectedCountries: document.getElementById('country')?.selectedOptions,
        country: safeGetSelectedOptions('country'),
        platforms: safeGetSelectedOptions('platforms'),
        title: safeGetValue("title"),
        date: safeGetValue("date"),
        threatActor: safeGetValue("threatActor"),
        authors: authors.join('; '),
        summaryIncident: safeGetValue("summary-incident"),
        summaryNarrative: safeGetValue("summary-narrative"),
        summaryImpact: safeGetValue("summary-impact"),
        summaryTTPs: safeGetValue("summary-ttps"),
        summaryRecommendations: safeGetValue("summary-recommendations"),
        incident: safeGetValue("incidentDescription"),
        metaNarrative: safeGetValue("metaNarrative"),
        reach: safeGetValue("reach"),
        outcome: safeGetValue("outcome"),
        actionsTaken: safeGetValue("actionsTaken")
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