// Cómo denunciar option configuration
// Reference: https://www.pajaroscaidos.org.ar/Como-denunciar/
var REPLY_OPTION_COMO_DENUNCIAR = {
  name: 'Cómo denunciar',
  replies: [
    {
      id: 'como_denunciar_1',
      text: 'Toda la información sobre cómo denunciar casos de maltrato, crueldad o tráfico ilegal de fauna se encuentra en el siguiente link: https://www.pajaroscaidos.org.ar/Como-denunciar/',
      image: null
    }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('como_denunciar', REPLY_OPTION_COMO_DENUNCIAR);
  }
})();

