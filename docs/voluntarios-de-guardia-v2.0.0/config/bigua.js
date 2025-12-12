// Bigua option configuration
var REPLY_OPTION_BIGUA = {
  name: 'Bigua',
  replies: [
  {
    id: 'bigua_1',
    text: '',
    image: 'acuaticas/acuatica.png'
  },
  {
    id: 'bigua_2',
    text: '',
    image: 'acuaticas/acuatica_que_hacer.png'
  },
  {
    id: 'bigua_3',
    text: '',
    image: 'acuaticas/bigua.png'
  }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('bigua', REPLY_OPTION_BIGUA);
  }
})();

