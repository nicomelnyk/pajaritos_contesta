// Anilladas option configuration
var REPLY_OPTION_ANILLADAS = {
  name: 'Anilladas',
  replies: [
    {
      id: 'anilladas_1',
      text: '¿Qué pasa cuando encontramos una paloma anillada?\n\nEspecialmente si está herida es importante que te comuniques con el dueño y averigüar si la interesa recibir a la paloma en esas condiciones. Muchas veces las sacrifican porque ya nos les sirven para lo que ellos quieren.\n\nEl contacto del dueño lo podes obtener en FCA (Federacion Colombofica Argentina) con la información que tiene el anillo.\n\nSi el dueño presenta poco interés en recibirla al enterarse que esta herida lo mejor es no insistir porque si se la dan la van a sacrificar.\n\nEn esta página se pueden obtener los datos del dueño por medio del anillo: http://www.fecoar.com.ar/',
      image: null
    }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('anilladas', REPLY_OPTION_ANILLADAS);
  }
})();

