/**
 * Integration Instructions for PDF AI Summarizer
 * 
 * Follow these steps to add AI-powered PDF summarization to your incident form:
 */

// STEP 1: Add to your HTML head section (before closing </head> tag)
/*
<!-- PDF.js Library for PDF text extraction -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
*/

// STEP 2: Add to your script loading section (with your other script tags)
/*
<script src="pdf-ai-summarizer.js" defer></script>
*/

// STEP 3: Configure your OpenAI API key
// The system will prompt for your API key when first used
function initializeAISummarizer() {
    // API key will be prompted when needed and saved locally
    // Get your API key from: https://platform.openai.com/api-keys
    console.log('AI Summarizer ready - will prompt for API key on first use');
}

// STEP 4: Configure your OpenAI API key in config.js
// Add your API key to the OPENAI_API_KEY constant in config.js
// The initialization will happen automatically when the page loads
/*
In config.js:
const OPENAI_API_KEY = ''; // Leave empty - will prompt when needed

// The initializeAISummarizer() function is already integrated into initializeConfig()
// No additional DOMContentLoaded handlers needed!
*/

// STEP 5: Optional - Add manual trigger function
function generateSummaryFromCurrentURL() {
    const reportUrl = document.getElementById('reporturlInput')?.value;
    
    if (!reportUrl) {
        alert('Please enter a Report URL first');
        return;
    }
    
    // This will trigger the AI summarization
    generateIncidentDescription(reportUrl)
        .then(summary => {
            console.log('Summary generated:', summary);
        })
        .catch(error => {
            console.error('Error generating summary:', error);
        });
}

/**
 * OPTIONAL ENHANCEMENTS:
 */

// Enhanced error handling for PDF processing
function enhancedPDFProcessing() {
    // Override the default error messages with more user-friendly ones
    const originalExtractText = window.extractTextFromPDF;
    
    window.extractTextFromPDF = async function(pdfUrl) {
        try {
            return await originalExtractText(pdfUrl);
        } catch (error) {
            // Handle common PDF errors
            if (error.message.includes('CORS')) {
                throw new Error('PDF cannot be accessed due to CORS restrictions. Please ensure the PDF URL allows cross-origin requests.');
            } else if (error.message.includes('404')) {
                throw new Error('PDF not found at the provided URL. Please check the URL and try again.');
            } else if (error.message.includes('Invalid PDF')) {
                throw new Error('The file at the provided URL is not a valid PDF document.');
            }
            throw error;
        }
    };
}

// Add validation for incident description field
function validateIncidentDescriptionField() {
    const descriptionField = document.getElementById('incidentDescription') || 
                           document.getElementById('description') ||
                           document.querySelector('textarea[placeholder*="description" i]');
    
    if (!descriptionField) {
        console.warn('Incident description field not found. AI summarizer may not work properly.');
        return false;
    }
    
    return true;
}

// Enhanced progress indicator with better styling
function createEnhancedProgressIndicator() {
    const style = document.createElement('style');
    style.textContent = `
        #ai-progress-indicator {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            animation: slideInRight 0.3s ease-out;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        #ai-progress-indicator.success {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        }
        
        #ai-progress-indicator.error {
            background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
        }
        
        #ai-progress-indicator.info {
            background: linear-gradient(135deg, #007bff 0%, #6610f2 100%);
        }
    `;
    document.head.appendChild(style);
}

/**
 * SECURITY CONSIDERATIONS:
 */

// Function to securely handle API keys (recommended approach)
function setupSecureAPIKey() {
    // Instead of hardcoding API key, consider:
    
    // 1. Environment variables (for server-side)
    // const apiKey = process.env.OPENAI_API_KEY;
    
    // 2. Secure storage in browser
    // const apiKey = localStorage.getItem('openai_api_key_encrypted');
    
    // 3. Server-side proxy (recommended for production)
    // Make API calls through your own server to keep the API key secure
    
    console.log('For production use, implement server-side API proxy for security');
}

/**
 * EXAMPLE USAGE IN YOUR EXISTING FORM:
 */

// Add this to your existing form event handlers
function handleReportURLChange() {
    const reportUrlField = document.getElementById('reporturlInput');
    const aiButton = document.querySelector('button[textContent*="Generate AI Summary"]');
    
    if (reportUrlField && aiButton) {
        // Enable/disable AI button based on URL validity
        reportUrlField.addEventListener('input', function() {
            const isValidUrl = this.value.trim().length > 0;
            aiButton.disabled = !isValidUrl;
        });
    }
}

// Integration with your existing validation
function integrateWithExistingValidation() {
    // If you have existing URL validation, enhance it
    const existingValidation = window.validateURL;
    
    if (typeof existingValidation === 'function') {
        window.validateURL = function(url) {
            const isValid = existingValidation(url);
            
            // Additional check for PDF URLs
            if (isValid && url.toLowerCase().includes('.pdf')) {
                console.log('PDF URL detected - AI summarization available');
            }
            
            return isValid;
        };
    }
}

/**
 * TROUBLESHOOTING TIPS:
 */

function troubleshootingTips() {
    console.group('🔧 AI Summarizer Troubleshooting');
    console.log('1. Check if PDF.js is loaded:', typeof pdfjsLib !== 'undefined');
    console.log('2. Check if OpenAI API key is set:', AI_CONFIG?.OPENAI_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('3. Check if incident description field exists:', document.getElementById('incidentDescription') !== null);
    console.log('4. Check for CORS issues if PDF processing fails');
    console.log('5. Monitor network tab for API request failures');
    console.groupEnd();
}

// Run troubleshooting when needed
// troubleshootingTips();