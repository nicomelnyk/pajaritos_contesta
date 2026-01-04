// Canario option configuration
var REPLY_OPTION_CANARIO = {
  name: 'Canario',
  replies: [
    {
      id: 'canario_1',
      text: 'El canario es un ave exótica. NO DEBEMOS LIBERARLAS ya que no podrá sobrevivir si lo liberamos. Son aves diurnas que comen de día y duermen de noche.\n\nEsta guía contiene información completa sobre su dieta, cuidados, suplementos vitales, accesorios indispensables y peligros a evitar.',
      image: 'canario.png'
    }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('canario', REPLY_OPTION_CANARIO);
  }
})();

