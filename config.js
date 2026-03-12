// Google Sheets Configuration
const CONFIG = {
    // IMPORTANT: Replace these URLs with your Google Apps Script Web App URLs
    // After deploying your Apps Script, copy the URL and paste here
    
    servicesSheet: {
        // URL to fetch services from Google Sheets
        apiUrl: 'YOUR_GOOGLE_APPS_SCRIPT_URL', // Add ?action=getServices
        sheetName: 'Services',
        range: 'A2:F' // Starting from row 2 to skip headers
    },
    
    ordersSheet: {
        // URL to send order data to Google Sheets
        apiUrl: 'YOUR_GOOGLE_APPS_SCRIPT_URL', // For POST requests
        sheetName: 'Orders'
    },
    
    // App settings
    appName: 'Unisex Salon POS',
    version: '1.0.0',
    
    // Demo mode - set to false when Google Sheets is configured
    demoMode: true
};