// Background service worker for Chrome extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Pajaritos Contesta extension installed');
  
  // Set default values
  chrome.storage.sync.set({
    enabled: false,
    rules: [],
    delay: 2000
  });
});

