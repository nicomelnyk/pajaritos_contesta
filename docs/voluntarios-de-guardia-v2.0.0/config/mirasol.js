// Mirasol option configuration
var REPLY_OPTION_MIRASOL = {
  name: 'Mirasol',
  replies: [
  {
    id: 'mirasol_1',
    text: '',
    image: 'acuaticas/acuatica.png'
  },
  {
    id: 'mirasol_2',
    text: '',
    image: 'acuaticas/acuatica_que_hacer.png'
  },
  {
    id: 'mirasol_3',
    text: '',
    image: 'acuaticas/mirasol.png'
  }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('mirasol', REPLY_OPTION_MIRASOL);
  }
})();




