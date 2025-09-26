/**
 * Script to extract DISARM techniques from disarm_red_framework_clickable.html
 * and generate a JSON file with technique IDs and names
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read the HTML file
function extractTechniques() {
    try {
        // Read the HTML file
        const htmlContent = fs.readFileSync('disarm_red_framework_clickable.html', 'utf8');
        
        // Parse the HTML using JSDOM
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;
        
        // Find all td elements with technique IDs (they have IDs starting with 'T')
        const techniqueCells = document.querySelectorAll('td[id^="T"]');
        
        const techniques = [];
        
        techniqueCells.forEach(cell => {
            const techniqueId = cell.id;
            const cellText = cell.textContent;
            
            // Skip if this is a text element (ends with 'text') or empty cells
            if (techniqueId.endsWith('text') || !cellText.trim()) {
                return;
            }
            
            // Extract technique name by removing the ID and any checkbox text
            // Format: "T0086.001 Develop Memes<input...>" -> "Develop Memes"
            let techniqueName = cellText
                .replace(techniqueId, '') // Remove the technique ID
                .replace(/\s*<input.*$/i, '') // Remove any input elements (shouldn't be in textContent but just in case)
                .trim();
            
            // Clean up any remaining artifacts
            techniqueName = techniqueName.replace(/^\s+/, '');
            
            if (techniqueName && techniqueName.length > 0) {
                techniques.push({
                    type: "technique",
                    id: techniqueId,
                    name: techniqueName
                });
            }
        });
        
        // Sort techniques by ID for consistency
        techniques.sort((a, b) => {
            // Custom sort to handle technique IDs properly (T0001 before T0002, T0001.001 after T0001)
            const parseId = (id) => {
                const parts = id.replace('T', '').split('.');
                return {
                    main: parseInt(parts[0]),
                    sub: parts[1] ? parseInt(parts[1]) : 0
                };
            };
            
            const aId = parseId(a.id);
            const bId = parseId(b.id);
            
            if (aId.main !== bId.main) {
                return aId.main - bId.main;
            }
            return aId.sub - bId.sub;
        });
        
        // Write to JSON file
        const jsonOutput = JSON.stringify(techniques, null, 2);
        fs.writeFileSync('disarm-techniques.json', jsonOutput, 'utf8');
        
        console.log(`Successfully extracted ${techniques.length} techniques to disarm-techniques.json`);
        
        // Show first few techniques as example
        console.log('\nFirst 5 techniques:');
        techniques.slice(0, 5).forEach(tech => {
            console.log(`${tech.id}: ${tech.name}`);
        });
        
        return techniques;
        
    } catch (error) {
        console.error('Error extracting techniques:', error.message);
        
        if (error.code === 'ENOENT') {
            console.error('\nMake sure disarm_red_framework_clickable.html exists in the current directory');
            console.error('Or run this script from the correct directory');
        }
        
        if (error.message.includes('jsdom')) {
            console.error('\nPlease install jsdom first:');
            console.error('npm install jsdom');
        }
        
        process.exit(1);
    }
}

// Run the extraction
if (require.main === module) {
    extractTechniques();
}

module.exports = { extractTechniques };