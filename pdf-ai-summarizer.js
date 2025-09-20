/**
 * PDF AI Summarizer Module
 * Handles PDF text extraction and Airbolt API integration for automatic incident description generation
 * 
 * Dependencies:
 * - PDF.js library for PDF text extraction
 * - Airbolt API endpoint
 * 
 * Usage:
 * 1. Include PDF.js library in your HTML
 * 2. Call generateIncidentDescription() with a PDF URL to process and summarize
 */

/**
 * Initialize the AI summarizer when DOM is ready
 * Disabled for compact form - uses inline implementation
 */
/*
document.addEventListener('DOMContentLoaded', function() {
    // Automatically add the button when the page loads
    addAISummarizerButton();
    
    // Check if PDF.js is loaded
    if (typeof pdfjsLib === 'undefined') {
        console.warn('PDF.js library not found. Please include it in your HTML:');
        console.warn('<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>');
    }
});
*/

// Configuration
const AI_CONFIG = {
    // Set your OpenAI API key here (consider using environment variables in production)
    OPENAI_API_KEY: '', // Replace with your actual API key
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    AIRBOLT_API_URL: 'https://my-ai-backend.onrender.com/chat/completions',
    MODEL: 'gpt-3.5-turbo', // or 'gpt-4' for better quality
    MAX_TOKENS: 1000, // Adjust based on desired summary length
    TEMPERATURE: 0.3, // Lower = more focused, higher = more creative
    
    // CORS proxy options for PDF access
    CORS_PROXIES: [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/'
    ]
};

// PDF.js worker configuration (load from CDN)
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

/**
 * Main function to generate incident description from PDF URL
 * @param {string} pdfUrl - URL of the PDF to process
 * @returns {Promise<string>} - Generated incident description
 */
async function generateIncidentDescription(pdfUrl) {
    try {
        showProgressIndicator('Downloading PDF...');
        
        // Validate inputs
        if (!pdfUrl) {
            throw new Error('PDF URL is required');
        }
        
        // Extract text from PDF
        showProgressIndicator('Extracting text from PDF...');
        const pdfText = await extractTextFromPDF(pdfUrl);
        
        if (!pdfText || pdfText.trim().length === 0) {
            throw new Error('No text could be extracted from the PDF');
        }
        
        // Generate summary using Airbolt API
        showProgressIndicator('Generating AI summary...');
        const summary = await generateAISummary(pdfText);
        
        // Update the incident description field
        updateIncidentDescriptionField(summary);
        
        showProgressIndicator('Summary generated successfully!', 'success');
        setTimeout(hideProgressIndicator, 3000);
        
        return summary;
        
    } catch (error) {
        console.error('Error generating incident description:', error);
        showProgressIndicator(`Error: ${error.message}`, 'error');
        setTimeout(hideProgressIndicator, 5000);
        throw error;
    }
}

/**
 * Extract text from PDF using PDF.js
 * @param {string} pdfUrl - URL of the PDF file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPDF(pdfUrl) {
    try {
        let pdf;
        const proxies = AI_CONFIG.CORS_PROXIES;
        
        // Try multiple approaches to load the PDF
        for (let i = 0; i < proxies.length; i++) {
            try {
                const proxy = proxies[i];
                const proxiedUrl = proxy + encodeURIComponent(pdfUrl);
                
                console.log(`Attempt ${i + 1}: Loading PDF via proxy:`, proxy);
                
                pdf = await pdfjsLib.getDocument({
                    url: proxiedUrl,
                    withCredentials: false
                }).promise;
                
                console.log('Successfully loaded PDF via proxy');
                break; // Success, exit the loop
                
            } catch (proxyError) {
                console.warn(`Proxy ${i + 1} failed:`, proxyError.message);
                
                // If this is the last proxy, try direct access
                if (i === proxies.length - 1) {
                    console.log('All proxies failed, trying direct access...');
                    
                    try {
                        pdf = await pdfjsLib.getDocument({
                            url: pdfUrl,
                            withCredentials: false
                        }).promise;
                        
                        console.log('Successfully loaded PDF via direct access');
                    } catch (directError) {
                        throw new Error('All methods failed to load PDF due to CORS restrictions');
                    }
                }
            }
        }
        let fullText = '';
        
        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Combine text items from the page
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ')
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
            
            fullText += pageText + '\n\n';
        }
        
        return fullText.trim();
        
    } catch (error) {
        console.error('PDF extraction error:', error);
        
        // If CORS proxy fails, try a different approach or provide guidance
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            throw new Error('Unable to access PDF due to CORS restrictions. Please try:\n1. Using a direct PDF download link\n2. Hosting the PDF on a CORS-enabled server\n3. Using a local PDF file');
        }
        
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

/**
 * Generate AI summary using Airbolt API
 * @param {string} text - Text content to summarize
 * @returns {Promise<string>} - AI-generated summary
 */
async function generateAISummary(text) {
    try {
        // Truncate text if too long (GPT-3.5-turbo has ~4096 token limit)
        const maxInputLength = 12000; // Rough character limit to stay under token limit
        const inputText = text.length > maxInputLength ? 
            text.substring(0, maxInputLength) + '...[truncated]' : 
            text;
        
        const prompt = `Please analyze the following cybersecurity incident report and provide a concise half-page summary that includes:

1. **Incident Overview**: What happened and when
2. **Threat Actor**: Who was responsible (if identified)
3. **Attack Methods**: How the attack was carried out
4. **Impact**: What systems, data, or operations were affected
5. **Key Findings**: Important technical details or indicators
6. **Timeline**: Key dates and progression of the incident

Please write this as a professional incident description suitable for a cybersecurity report. Focus on factual information and avoid speculation.

Document text:
${inputText}`;

//      const response = await fetch(AI_CONFIG.OPENAI_API_URL, {
        const response = await fetch(AI_CONFIG.AIRBOLT_API_URL, {           
            method: 'POST',
/*          headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.OPENAI_API_KEY}`
            },
*/
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: AI_CONFIG.MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a cybersecurity analyst expert at summarizing incident reports. Provide clear, structured, and professional summaries.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: AI_CONFIG.MAX_TOKENS,
                temperature: AI_CONFIG.TEMPERATURE
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Airbolt API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from Airbolt API');
        }
        
        return data.choices[0].message.content.trim();
        
    } catch (error) {
        console.error('AI summary generation error:', error);
        throw new Error(`Failed to generate AI summary: ${error.message}`);
    }
}

/**
 * Update the incident description field with the generated summary
 * @param {string} summary - Generated summary text
 */
function updateIncidentDescriptionField(summary) {
    const descriptionField = document.getElementById('incidentDescription') || 
                           document.getElementById('incident') ||
                           document.getElementById('description') ||
                           document.querySelector('textarea[placeholder*="description" i]');
    
    if (descriptionField) {
        descriptionField.value = summary;
        
        // Trigger change event to ensure any listeners are notified
        descriptionField.dispatchEvent(new Event('change', { bubbles: true }));
        descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Add visual indication that the field was auto-generated
        descriptionField.style.backgroundColor = '#f0fff0'; // Light green background
        setTimeout(() => {
            descriptionField.style.backgroundColor = '';
        }, 3000);
    } else {
        console.warn('Incident description field not found');
    }
}

/**
 * Show progress indicator to user
 * @param {string} message - Progress message
 * @param {string} type - Type of message ('info', 'success', 'error')
 */
function showProgressIndicator(message, type = 'info') {
    let indicator = document.getElementById('ai-progress-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'ai-progress-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        document.body.appendChild(indicator);
    }
    
    // Set color based on type
    const colors = {
        info: '#007bff',
        success: '#28a745',
        error: '#dc3545'
    };
    
    indicator.style.backgroundColor = colors[type] || colors.info;
    indicator.textContent = message;
    indicator.style.display = 'block';
}

/**
 * Hide progress indicator
 */
function hideProgressIndicator() {
    const indicator = document.getElementById('ai-progress-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

/**
 * Add a button to trigger AI summarization
 * Call this function to add the feature to your form
 */
function addAISummarizerButton() {
    // Find the report URL field - try multiple possible IDs
    const reportUrlField = document.getElementById('reportURL') || 
                          document.getElementById('reporturlInput') ||
                          document.getElementById('reportUrlInput');
    if (!reportUrlField) {
        console.warn('Report URL field not found');
        return;
    }
    
    // Create the button
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Summarize';
    button.className = 'add-button';
    button.style.cssText = `
        margin-left: 10px;
        padding: 6px 12px;
        font-size: 12px;
        white-space: nowrap;
    `;
    
    // Add click handler
    button.addEventListener('click', async () => {
        const pdfUrl = reportUrlField.value.trim();
        
        if (!pdfUrl) {
            alert('Please enter a Report URL first');
            reportUrlField.focus();
            return;
        }
        
        if (!pdfUrl.toLowerCase().includes('.pdf')) {
            if (!confirm('The URL doesn\'t appear to be a PDF. Continue anyway?')) {
                return;
            }
        }
        
        try {
            button.disabled = true;
            button.textContent = 'Processing...';
            
            await generateIncidentDescription(pdfUrl);
            
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            button.disabled = false;
            button.textContent = 'Summarize';
        }
    });
    
    // Insert button after the report URL field
    const container = reportUrlField.parentElement;
    
    // Create a wrapper div for the input and button
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 5px;
    `;
    
    // Insert wrapper after the input field
    reportUrlField.parentNode.insertBefore(wrapper, reportUrlField.nextSibling);
    wrapper.appendChild(button);
}

/**
 * Configuration function to set Airbolt API settings
 * @param {string} apiUrl - Your Airbolt API URL
 */
function setAirboltApiUrl(apiUrl) {
    AI_CONFIG.AIRBOLT_API_URL = apiUrl;
}

/**
 * Initialize the AI summarizer when DOM is ready
 * Disabled for compact form - uses inline implementation
 */
/*
document.addEventListener('DOMContentLoaded', function() {
    // Automatically add the button when the page loads
    addAISummarizerButton();
    
    // Check if PDF.js is loaded
    if (typeof pdfjsLib === 'undefined') {
        console.warn('PDF.js library not found. Please include it in your HTML:');
        console.warn('<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>');
    }
});
*/

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateIncidentDescription,
        setAirboltApiUrl,
        addAISummarizerButton
    };
}