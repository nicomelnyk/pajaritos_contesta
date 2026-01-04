// Gallos, Pollos, Codorniz option configuration
// Reference: https://pajaros-caidos.blogspot.com.ar/2010/01/gallinas-gallos-pollos-pollas.html
var REPLY_OPTION_GALLOS = {
  name: 'Gallos, Pollos, Codorniz',
  subtypes: {
  pichon: {
    name: 'Pichón',
    replies: [
    {
      id: 'gallos_pichon_1',
      text: 'En este link hay información relacionada a su dieta y cuidados. Como primer paso leelo con tranquilidad https://pajaros-caidos.blogspot.com.ar/2010/01/gallinas-gallos-pollos-pollas.html',
      image: 'acuaticas/pollito_pichon.png'
    }
    ]
  }
  },
  replies: [
    {
      id: 'gallos_1',
      text: 'En este link hay información relacionada a su dieta y cuidados. Como primer paso leelo con tranquilidad https://pajaros-caidos.blogspot.com.ar/2010/01/gallinas-gallos-pollos-pollas.html',
      image: null
    }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('gallos', REPLY_OPTION_GALLOS);
  }
})();

