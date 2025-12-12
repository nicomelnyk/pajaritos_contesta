// Background service worker for Chrome extension

// Storage version to track migrations
const STORAGE_VERSION = '2.1.0';

// Migration function to preserve data across reinstalls
async function migrateStorageData() {
  try {
    // Get all storage data
    const allData = await chrome.storage.local.get(null);
    
    // Check if we need to migrate
    const currentVersion = allData.pajaritos_storage_version;
    
    if (currentVersion === STORAGE_VERSION) {
      console.log('[Pajaritos] ✅ Storage version is up to date:', STORAGE_VERSION);
      return;
    }
    
    console.log('[Pajaritos] 🔄 Migrating storage data from version', currentVersion || 'unknown', 'to', STORAGE_VERSION);
    
    // Preserve all existing form data
    const formDataKeys = Object.keys(allData).filter(key => key.startsWith('pajaritos_form_'));
    const preservedData = {};
    
    // Preserve form data
    formDataKeys.forEach(key => {
      preservedData[key] = allData[key];
    });
    
    // Preserve other important data
    if (allData.pajaritos_last_option) {
      preservedData.pajaritos_last_option = allData.pajaritos_last_option;
    }
    if (allData.pajaritos_last_subtype) {
      preservedData.pajaritos_last_subtype = allData.pajaritos_last_subtype;
    }
    if (allData.commentHistory) {
      preservedData.commentHistory = allData.commentHistory;
    }
    
    // Update storage version
    preservedData.pajaritos_storage_version = STORAGE_VERSION;
    
    // Save preserved data
    await chrome.storage.local.set(preservedData);
    
    console.log('[Pajaritos] ✅ Storage migration completed. Preserved', formDataKeys.length, 'form data entries');
  } catch (error) {
    console.error('[Pajaritos] ❌ Error during storage migration:', error);
  }
}

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Voluntarios de Guardia extension installed', details.reason);
  
  // Run migration on install or update
  if (details.reason === 'install' || details.reason === 'update') {
    await migrateStorageData();
  }
});

// Also run migration on startup to catch any edge cases
chrome.runtime.onStartup.addListener(async () => {
  await migrateStorageData();
});

