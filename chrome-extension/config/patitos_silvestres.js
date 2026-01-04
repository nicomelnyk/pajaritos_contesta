// Patitos Silvestres / Pato, Ganzo option configuration
// Reference: https://pajaros-caidos.blogspot.com.ar/2010/01/gallinas-gallos-pollos-pollas.html
var REPLY_OPTION_PATITOS_SILVESTRES = {
  name: 'Patitos Silvestres / Pato, Ganzo',
  subtypes: {
  pichon: {
    name: 'Patitos Silvestres',
    replies: [
    {
      id: 'patitos_silvestres_pichon_1',
      text: 'Si encontrás un patito silvestre pichón, la ÚNICA forma de tener la seguridad de que va a sobrevivir, es REGRESARLO CON SU MADRE.\n\nEl patito silvestre se niega a comer si no tiene el estímulo materno, no regula su temperatura corporal, se estresa y se deja morir.\n\nEs muy difícil alimentarlo, tanto en calidad como en cantidad, para suplir la alimentación que tendría en la naturaleza.\n\nEl patito silvestre estará un par de días activo, se irá debilitando, hasta morir. Por eso lo mejor es ubicar a su madre cuanto antes.',
      image: 'acuaticas/pato_silvestre.png'
    },
    {
      id: 'patitos_silvestres_pichon_2',
      text: 'Si lo criamos a mano humanizado, no podrá volver a la naturaleza, porque no sabrá valerse por sí mismo.\n\nSi se cría improntado, las aves silvestres lo atacarán por no reconocerlo como par. Las reservas de fauna no reciben aves improntadas.\n\nSi lo acabas de encontrar y te parece "lindo": pensá en él, en su vida, en su futuro y hacé lo correcto: DEVOLVELO CON SUS PADRES.\n\nRESPETEMOS LA NATURALEZA. No saquemos los pichones de los nidos, intervenimos sólo en casos estrictamente necesario y a consciencia. Protejamos a las aves silvestres, disfrutemoslas volando en libertad.',
      image: 'acuaticas/patito_silvestre_2.png'
    }
    ]
  },
  adulto: {
    name: 'Pato, Ganzo',
    replies: [
    {
      id: 'patitos_silvestres_adulto_1',
      text: 'En este link hay información relacionada a su dieta y cuidados. Como primer paso leelo con tranquilidad https://pajaros-caidos.blogspot.com.ar/2010/01/gallinas-gallos-pollos-pollas.html',
      image: null
    }
    ]
  }
  }
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('patitos_silvestres', REPLY_OPTION_PATITOS_SILVESTRES);
  }
})();

