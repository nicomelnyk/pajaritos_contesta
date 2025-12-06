// Acuaticas option configuration
var REPLY_OPTION_ACUATICAS = {
  name: 'Acuaticas',
  replies: [
    {
      id: 'acuaticas_1',
      text: '',
      image: 'acuaticas/acuatica.png'
    },
    {
      id: 'acuaticas_2',
      text: '',
      image: 'acuaticas/acuatica_que_hacer.png'
    }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('acuaticas', REPLY_OPTION_ACUATICAS);
  }
})();




