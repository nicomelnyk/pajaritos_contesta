// Gallareta option configuration
var REPLY_OPTION_GALLARETA = {
  name: 'Gallareta',
  replies: [
  {
    id: 'gallareta_1',
    text: '',
    image: 'acuaticas/acuatica.png'
  },
  {
    id: 'gallareta_2',
    text: '',
    image: 'acuaticas/acuatica_que_hacer.png'
  },
  {
    id: 'gallareta_3',
    text: '',
    image: 'acuaticas/gallareta.png'
  }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('gallareta', REPLY_OPTION_GALLARETA);
  }
})();

