// Ninfas option configuration
var REPLY_OPTION_NINFAS = {
  name: 'Ninfas/Cocotillas',
  replies: [
  {
    id: 'ninfas_1',
    text: 'Es una ninfa/cocotilla ave exótica NO LIBERABLE, probablemente alguien la esté buscando pueden publicar en redes sociales o folletos que la encontraron',
    image: 'liberar_ave.png'
  },
  {
    id: 'ninfas_2',
    text: '',
    image: 'ninfas/ninfas.png'
  }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('ninfas', REPLY_OPTION_NINFAS);
  }
})();

