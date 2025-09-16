/**
 * DOCX Summary Table Module
 * Handles creation of the summary table for the Word document
 */

// Create Summary Table
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