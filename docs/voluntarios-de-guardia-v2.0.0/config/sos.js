// SOS option configuration
var REPLY_OPTION_SOS = {
  name: 'SOS',
  replies: [
  {
    id: 'sos_1',
    text: '',
    image: 'sos_1.png'
  }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('sos', REPLY_OPTION_SOS);
  }
})();




