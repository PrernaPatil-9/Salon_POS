// Google Sheets Configuration
const CONFIG = {
    // Your Google Apps Script Web App URL
    googleScriptUrl: 'https://script.google.com/macros/s/AKfycbz0oLDDnCldYAiUJe6d6HJx_DuCTdz9dVf4AaNfBzz-Xi04gNo6DW4ET1A_A94CEx2m/exec',
    
    // App settings
    appName: 'Unisex Salon POS',
    version: '1.0.0',
    
    // Demo mode - set to false to use Google Sheets
    demoMode: false,
    
 upiId: 'salon@okhdfcbank', // Replace with your actual UPI ID

    // Sheet configuration
    servicesSheet: {
        apiUrl: 'https://script.google.com/macros/s/AKfycbz0oLDDnCldYAiUJe6d6HJx_DuCTdz9dVf4AaNfBzz-Xi04gNo6DW4ET1A_A94CEx2m/exec?action=getServices',
        sheetName: 'salon_services'
    },
    
    ordersSheet: {
        apiUrl: 'https://script.google.com/macros/s/AKfycbz0oLDDnCldYAiUJe6d6HJx_DuCTdz9dVf4AaNfBzz-Xi04gNo6DW4ET1A_A94CEx2m/exec?action=saveOrder',
        sheetName: 'salon_orders'
    }
};

