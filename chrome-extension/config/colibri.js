// Colibri option configuration
var REPLY_OPTION_COLIBRI = {
  name: 'Colibri',
  replies: [
  {
    id: 'colibri_1',
    text: 'Estos son los 3 pasos a seguir para que podamos ayudarte y vos puedas ayudar al colibrí:\n\n1) Lee con detenimiento toda la información que se encuentra en el blog\n\nhttp://pajaros-caidos.blogspot.com/2023/02/alimentacion-para-colibries-turno.html\n\n2) Contanos de dónde sos y en qué situación encontraste al ave\n\n3) Una vez leída toda la información, solicitá por favor ingreso a este grupo para atención personalizada\n\nhttps://www.facebook.com/groups/860979661773559/\n\nCon ellos hay que actuar rápido así que por favor seguí los tres pasos apenas leas este comentario 🙌🏻',
    image: null
  }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('colibri', REPLY_OPTION_COLIBRI);
  }
})();

