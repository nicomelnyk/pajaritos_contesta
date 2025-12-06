// Background service worker for Chrome extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Voluntarios de Guardia extension installed');
  
  // Set default values
  chrome.storage.sync.set({
    enabled: false,
    rules: [],
    delay: 2000
  });
});

// Background service worker for Chrome extension
// (No special message handling needed for modal approach)

