// Configuration file for pre-defined reply options
// This file automatically combines all individual option files into REPLY_OPTIONS
// 
// How it works:
// 1. config/helper.js is loaded first and initializes REPLY_OPTIONS_REGISTRY
// 2. Each config file auto-registers itself using REPLY_OPTIONS_REGISTER()
// 3. This file combines all registered options into REPLY_OPTIONS

var REPLY_OPTIONS = {};

// Combine all registered options from the registry
(function() {
  var globalObj = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
  
  if (globalObj.REPLY_OPTIONS_REGISTRY) {
    for (var key in globalObj.REPLY_OPTIONS_REGISTRY) {
      if (globalObj.REPLY_OPTIONS_REGISTRY.hasOwnProperty(key)) {
        REPLY_OPTIONS[key] = globalObj.REPLY_OPTIONS_REGISTRY[key];
      }
    }
  }
})();

// To add a new option (very simple):
// 1. Create a new file in config/ folder (e.g., config/nueva_opcion.js)
// 2. Define: var REPLY_OPTION_NUEVA_OPCION = { name: '...', replies: [...] };
// 3. At the end of the file, add:
//    (function() {
//      if (typeof REPLY_OPTIONS_REGISTER === 'function') {
//        REPLY_OPTIONS_REGISTER('nueva_opcion', REPLY_OPTION_NUEVA_OPCION);
//      }
//    })();
// 4. Add the file to manifest.json content_scripts js array before config.js
// That's it! The option will be automatically added to REPLY_OPTIONS!
