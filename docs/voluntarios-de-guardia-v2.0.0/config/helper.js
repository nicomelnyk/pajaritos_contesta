// Helper file that initializes the registration system
// This must be loaded before any config option files
// It provides automatic registration for all REPLY_OPTION_* variables

(function() {
  // Create global registry
  var globalObj = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
  
  if (!globalObj.REPLY_OPTIONS_REGISTRY) {
    globalObj.REPLY_OPTIONS_REGISTRY = {};
  }
  
  // Auto-registration function that will be called at the end of each config file
  // Each config file should end with: (function() { if (typeof REPLY_OPTIONS_REGISTER === 'function') REPLY_OPTIONS_REGISTER('option_key', REPLY_OPTION_*); })();
  globalObj.REPLY_OPTIONS_REGISTER = function(optionKey, optionValue) {
    if (globalObj.REPLY_OPTIONS_REGISTRY && optionKey && optionValue) {
      globalObj.REPLY_OPTIONS_REGISTRY[optionKey] = optionValue;
    }
  };
})();

