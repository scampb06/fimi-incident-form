/**
 * Global Configuration and State Variables
 * Contains all global variables, counters, and configuration used across modules
 */

// Global state variables for form data
let objectivesList = [];
let ttpsList = [];
let imagelogo = null;
let navigatorFileUploaded = false; // Track if the navigator file was uploaded successfully

// UI counters for dynamic form elements
let ttpCount = 1;
let observableCount = 1;
let authorCount = 1;
let subNarrativeCount = 1; // Start from 1 since one is already present in compact form
let recommendationCount = 1; // Start from 1 since one is already present in compact form

// Debounce timers for URL validation
let reportdebounceTimer;
let evidencedebounceTimer;

// Author modal callback
let authorCallback = null;

// DOM element references (initialized when DOM is ready)
let reporturlinput = null;
let reporturlerror = null;
let evidenceurlinput = null;
let evidenceurlerror = null;

// Initialize DOM references when document is loaded
function initializeConfig() {
    reporturlinput = document.getElementById('reporturlInput');
    reporturlerror = document.getElementById('reporturlError');
    evidenceurlinput = document.getElementById('evidenceurlInput');
    evidenceurlerror = document.getElementById('evidenceurlError');
}

// Call initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeConfig);
} else {
    initializeConfig();
}