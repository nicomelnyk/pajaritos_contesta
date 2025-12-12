// Aceite option configuration
var REPLY_OPTION_ACEITE = {
  name: 'Aceite',
  replies: [
    {
      id: 'aceite_1',
      text: 'El aceite hay que sacarlo con mucha paciencia porque no sale fácil y es muy importante estar atento al ave porque se pueden estresar muchísimo con la manipulación excesiva, asi que la limpieza se debe efectuar en varias sesiones rápidas y cortas. Si vemos que el ave boquea, respira con el pico, hay que detenerse y dejarlo descansar.',
      image: null
    },
    {
      id: 'aceite_2',
      text: 'Para lavarlos usamos lo que podamos: una bacha de laverse las manos, palangana o tupper con agua tibia y detergente hipoalergenico (cantidad mínima) y le vamos pasando el detergente con un cepillo de dientes o la mano misma, nada que raspe. Hay que cuidar que no le entre el detergente en el pico ni en los ojos, ni hay que sumergir el ave en el agua por mas que dejemos su cabeza afuera.\n\nIMPORTANTE RESGUARDARLO DE LAS CORRIENTES FRÍAS luego de ir mojándolo o cuando termines, le puede agarrar hipotermia.',
      image: null
    }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('aceite', REPLY_OPTION_ACEITE);
  }
})();

