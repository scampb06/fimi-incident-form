/**
 * PDF AI Summarizer Module
 * Handles PDF text extraction and OpenAI API integration for automatic incident description generation
 * 
 * Dependencies:
 * - PDF.js library for PDF text extraction
 * - OpenAI API key (requires user configuration)
 * 
 * Usage:
 * 1. Include PDF.js library in your HTML
 * 2. Set your OpenAI API key in the configuration
 * 3. Call generateIncidentDescription(pdfUrl) to process and summarize
 */

// Configuration
const AI_CONFIG = {
    // Set your OpenAI API key here (consider using environment variables in production)
    OPENAI_API_KEY: '', // Replace with your actual API key
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-3.5-turbo', // or 'gpt-4' for better quality
    MAX_TOKENS: 1000, // Adjust based on desired summary length
    TEMPERATURE: 0.3 // Lower = more focused, higher = more creative
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
        
/*         if (!AI_CONFIG.OPENAI_API_KEY) {
            // Try to prompt for API key if not set
            if (typeof promptForAPIKey === 'function') {
                const apiKey = promptForAPIKey();
                if (!apiKey) {
                    throw new Error('OpenAI API key is required to generate summaries');
                }
            } else {
                throw new Error('OpenAI API key not configured. Please set AI_CONFIG.OPENAI_API_KEY');
            }
        } */
        
        // Extract text from PDF
        showProgressIndicator('Extracting text from PDF...');
        const pdfText = await extractTextFromPDF(pdfUrl);
        
        if (!pdfText || pdfText.trim().length === 0) {
            throw new Error('No text could be extracted from the PDF');
        }
        
        // Generate summary using OpenAI
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
 * Extract text from PDF using PDF.js with CORS proxy fallback
 * @param {string} pdfUrl - URL of the PDF file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPDF(pdfUrl) {
    // Corsfix endpoints - reliable, fast CORS proxy service
    const corsFixProxies = [
        // Primary Corsfix endpoints (fastest)
        'https://corsfix.com/',
        'https://api.corsfix.com/',
        // Backup reliable proxies
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://thingproxy.freeboard.io/fetch/'
    ];
    
    const TIMEOUT_MS = 15000; // 15 seconds max timeout
    const FAST_TIMEOUT_MS = 8000; // 8 seconds for first attempts
    
    /**
     * Create a timeout promise that rejects after specified milliseconds
     */
    function createTimeoutPromise(ms, operation = 'operation') {
        return new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms)
        );
    }
    
    /**
     * Attempt to load PDF with timeout
     */
    async function loadPDFWithTimeout(url, timeoutMs) {
        const loadPromise = pdfjsLib.getDocument({
            url: url,
            httpHeaders: {
                'Accept': 'application/pdf,*/*',
                'Cache-Control': 'no-cache'
            },
            // PDF.js specific options
            verbosity: 0, // Reduce console noise
            enableXfa: false, // Disable XFA for performance
            disableAutoFetch: false,
            disableStream: false,
            disableRange: false
        }).promise;
        
        return Promise.race([
            loadPromise,
            createTimeoutPromise(timeoutMs, 'PDF loading')
        ]);
    }
    
    /**
     * Try to extract text using direct URL first, then Corsfix proxies
     */
    async function tryExtractWithFallback() {
        let lastError = null;
        
        // First, try direct access (works for same-origin or CORS-enabled URLs)
        try {
            console.log('Attempting direct PDF access...');
            const pdf = await loadPDFWithTimeout(pdfUrl, FAST_TIMEOUT_MS);
            return await extractTextFromPDF_Internal(pdf);
        } catch (error) {
            console.log('Direct access failed:', error.message);
            lastError = error;
            
            // If it's not a CORS error, don't try proxies
            if (!error.message.includes('CORS') && 
                !error.message.includes('Failed to fetch') &&
                !error.message.includes('NetworkError')) {
                throw error;
            }
        }
        
        // Try Corsfix and backup proxies with progressive timeout strategy
        console.log('Trying CORS proxies...');
        for (let i = 0; i < corsFixProxies.length; i++) {
            const proxy = corsFixProxies[i];
            let proxyUrl;
            
            // Handle different proxy URL formats
            if (proxy.includes('corsfix.com')) {
                // Corsfix format: https://corsfix.com/https://example.com/file.pdf
                proxyUrl = proxy + pdfUrl;
            } else if (proxy.includes('codetabs.com')) {
                // CodeTabs format: https://api.codetabs.com/v1/proxy?quest=URL
                proxyUrl = proxy + encodeURIComponent(pdfUrl);
            } else {
                // Standard format: https://proxy.com/URL
                proxyUrl = proxy + encodeURIComponent(pdfUrl);
            }
            
            const timeoutMs = i < 2 ? FAST_TIMEOUT_MS : TIMEOUT_MS; // Use longer timeout for backup proxies
            
            try {
                const proxyName = proxy.includes('corsfix.com') ? 'Corsfix' : 
                                proxy.includes('codetabs.com') ? 'CodeTabs' : 
                                proxy.includes('thingproxy.freeboard.io') ? 'ThingProxy' : 
                                `Proxy ${i + 1}`;
                
                console.log(`Attempting ${proxyName}: ${proxy}`);
                showProgressIndicator(`Trying ${proxyName}...`);
                
                const pdf = await loadPDFWithTimeout(proxyUrl, timeoutMs);
                console.log(`Success with ${proxyName}`);
                return await extractTextFromPDF_Internal(pdf);
                
            } catch (error) {
                console.log(`Proxy ${i + 1} failed:`, error.message);
                lastError = error;
                
                // If this proxy is permanently down or blocked, try next one quickly
                if (error.message.includes('timed out') || 
                    error.message.includes('NetworkError') ||
                    error.message.includes('Failed to fetch')) {
                    continue;
                }
                
                // For other errors, give it a moment before trying next proxy
                if (i < corsFixProxies.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }
        
        throw new Error(`All proxy attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }
    
    try {
        return await tryExtractWithFallback();
        
    } catch (error) {
        console.error('PDF extraction error:', error);
        
        // Provide helpful error messages based on the type of failure
        if (error.message.includes('timed out')) {
            throw new Error(`PDF loading timed out. The document may be too large or the server is slow. Please try again or use a different PDF.`);
        } else if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
            throw new Error(`Unable to access PDF due to server restrictions. Please check the URL or try downloading the PDF and using a local copy.`);
        } else {
            throw new Error(`Failed to extract text from PDF: ${error.message}`);
        }
    }
}

/**
 * Internal function to extract text from a loaded PDF document
 * @param {PDFDocumentProxy} pdf - Loaded PDF document
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPDF_Internal(pdf) {
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Combine text items from the page
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ')
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
            
            if (pageText) {
                fullText += pageText + '\n\n';
            }
            
            // Update progress for large documents
            if (pdf.numPages > 10 && pageNum % 5 === 0) {
                showProgressIndicator(`Processing page ${pageNum}/${pdf.numPages}...`);
            }
            
        } catch (pageError) {
            console.warn(`Error extracting text from page ${pageNum}:`, pageError.message);
            // Continue with other pages even if one fails
        }
    }
    
    const result = fullText.trim();
    
    if (!result || result.length < 50) {
        throw new Error('PDF appears to contain no readable text or may be image-based');
    }
    
    return result;
}

/**
 * Generate AI summary using OpenAI API
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

/*         const response = await fetch(AI_CONFIG.OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.OPENAI_API_KEY}`
            },
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
        }); */
        
//        const response = await fetch('http://localhost:5239/generate-text', { // Adjust port if needed
        const response = await fetch('https://fimi-incident-form-genai.azurewebsites.net/generate-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt })
/*             body: JSON.stringify({
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
            })         */    
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from OpenAI API');
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
 * Configuration function to set OpenAI API key
 * @param {string} apiKey - Your OpenAI API key
 */
function setOpenAIApiKey(apiKey) {
    AI_CONFIG.OPENAI_API_KEY = apiKey;
}

/**
 * Initialize the AI summarizer when DOM is ready
 * Disabled for compact form - uses inline implementation instead
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
        setOpenAIApiKey,
        addAISummarizerButton
    };
}