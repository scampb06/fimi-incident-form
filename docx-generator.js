/**
 * DOCX Generator Module
 * Handles document generation, orchestration, and file download
 */

// Generate Document with all tables
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

// Main DOCX Download Function
async function downloadAsDocx() {
    console.log("Starting the DOCX generation process...");

    try {
        // Get all form data
        const formData = collectFormData();
        const narratives = processNarratives();
        const objectives = processObjectivesAndTTPs();

        // Add processed narratives to formData
        formData.subNarrativeParagraph = narratives.subNarrativeParagraph;
        formData.recommendationParagraph = narratives.recommendationParagraph;

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

        // Create summary table
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

// Utility function to get authors string
function getAuthorsString(authorsDiv) {
    return Array.from(authorsDiv.querySelectorAll('.author-name'))
        .map(span => span.childNodes[0].textContent.trim())
        .join('; ');
}