// Garza option configuration
var REPLY_OPTION_GARZA = {
  name: 'Garza',
  replies: [
  {
    id: 'garza_1',
    text: '',
    image: 'acuaticas/acuatica.png'
  },
  {
    id: 'garza_2',
    text: '',
    image: 'acuaticas/acuatica_que_hacer.png'
  },
  {
    id: 'garza_3',
    text: '',
    image: 'acuaticas/garza.png'
  }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('garza', REPLY_OPTION_GARZA);
  }
})();

