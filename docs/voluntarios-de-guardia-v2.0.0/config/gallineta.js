// Gallineta option configuration
var REPLY_OPTION_GALLINETA = {
  name: 'Gallineta',
  replies: [
  {
    id: 'gallineta_1',
    text: '',
    image: 'acuaticas/acuatica.png'
  },
  {
    id: 'gallineta_2',
    text: '',
    image: 'acuaticas/acuatica_que_hacer.png'
  },
  {
    id: 'gallineta_3',
    text: '',
    image: 'acuaticas/gallineta.png'
  }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('gallineta', REPLY_OPTION_GALLINETA);
  }
})();

