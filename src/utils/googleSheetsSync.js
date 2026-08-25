// Google Sheets Real-Time Sync & Local Fallback Engine

const STORAGE_KEY = 'haikel_gallery_custom_data';
const SPREADSHEET_URL_KEY = 'haikel_gallery_sheets_endpoint';
const CACHE_TTL_MS = 5000; // 5s micro-cache

let memoryCache = {
  data: null,
  timestamp: 0
};

export const googleSheetsSync = {
  getEndpoint() {
    return localStorage.getItem(SPREADSHEET_URL_KEY) || '';
  },

  setEndpoint(url) {
    if (url) {
      localStorage.setItem(SPREADSHEET_URL_KEY, url.trim());
    } else {
      localStorage.removeItem(SPREADSHEET_URL_KEY);
    }
  },

  getLocalStoredData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse local stored media', e);
    }
    return null;
  },

  saveLocalStoredData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  },

  async fetchFromEndpoint(url) {
    const endpoint = url || this.getEndpoint();
    if (!endpoint) return null;

    const now = Date.now();
    if (memoryCache.data && (now - memoryCache.timestamp < CACHE_TTL_MS)) {
      return memoryCache.data;
    }

    const response = await fetch(endpoint, { method: 'GET', mode: 'cors' });
    if (!response.ok) throw new Error(`Fetch error ${response.status}`);
    const json = await response.json();
    
    const validData = Array.isArray(json) ? json : (json.data || []);
    if (validData.length > 0) {
      memoryCache = { data: validData, timestamp: now };
      this.saveLocalStoredData(validData);
    }
    return validData;
  },

  // Apps Script Code Template
  getAppsScriptTemplate() {
    return `// ==========================================
// GOOGLE APPS SCRIPT: Haikel Spatial Gallery API
// Deploy as Web App -> Anyone (Anonymous)
// ==========================================

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Media") || ss.getActiveSheet();
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return responseJSON({ success: true, data: [] });
    }
    
    var headers = data[0].map(function(h) { return String(h).trim(); });
    var rows = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var item = {};
      for (var j = 0; j < headers.length; j++) {
        item[headers[j]] = row[j];
      }
      if (item.status === 'active' || !item.status) {
        rows.push(item);
      }
    }
    
    return responseJSON({ success: true, count: rows.length, data: rows });
  } catch (err) {
    return responseJSON({ success: false, error: err.toString() });
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
  }
};
