/**
 * DOCX Content Tables Module
 * Handles creation of main content tables for the Word document
 */

// Create Main Content Tables
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