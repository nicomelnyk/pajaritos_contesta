// Teros option configuration
var REPLY_OPTION_TEROS = {
  name: 'Teros',
  subtypes: {
    pichon: {
      name: 'Pichón',
      replies: [
        {
          id: 'teros_pichon_1',
          text: 'Es importante primero tener en cuenta que SIEMPRE hay que buscar a los padres, porque no son aves que abandonen a los pichones. Les dejo dos imágenes donde se explica eso. Si la persona sigue sin encontrar a los padres se procede a pasarle la dieta y los consejos, pero es importante insistir en lo primero. Es similar a lo que sucede con los patos silvestres.',
          image: 'teros/no_abandonan.png'
        },
        {
          id: 'teros_pichon_2',
          text: 'Si no encontrás a los padres recién ahí podés leer la información de este link: https://pajaros-caidos.blogspot.com/2010/01/dieta-teros.html?fbclid=IwAR2wljOAT6JiRAgOOgtFsN0kxa6pZGFFxMOiNwnDOVx8gFcDlP95yYX0ylA',
          image: null
        },
        {
          id: 'teros_pichon_3',
          text: 'Los teros son aves netamente insectívoras y SI O SI deben comer bichos todos los días. Los insectos contienen quitina que es fundamental en su alimentación.\n\nPodes darle: grillos, tenebrios, zophobas, cucarachas, larvas, gusanos, moscas, gusano de mosca, pequeñas arañas, bicho bolita, polillas, lombrices, etc siempre teniendo en cuenta que no hayan sido envenados.\n\nNO le des: arañas grandes o ponzoñosas, alacranes, avispas, abejas, cucarachas envenenadas, ni babosas (son venenosas).\n\nAcá tenés un video con cosas a tener en cuenta cuando encontramos un tero:\n\nhttps://www.facebook.com/refugio.de.aves.pajaros.caidos/videos/891470247602730/?hc_location=ufi\n\nCaporaletti envia bichos a todo el país, tanto grillos, zophobas, tenebrios, cucarachas. Al ser pequeñito, si le compras bichos grandes por ahi hay que cortarlos en pedacitos y darle como el video que te pase de Clara. Podes conseguir bichos en mercadolibre o en cualquier veterinaria grande especializada como en Centropet: http://www.grilloscapos.com.ar/',
          image: null
        },
        {
          id: 'teros_pichon_4',
          text: 'Necesitan una fuente de calor constante por ser tan pequeños, para eso podes poner los pichones en una caja que tenga de "piso" papel de cocina o hiegiénico y coloques una bolsa de agua caliente o una botella, ambas envueltas con un trapo para no quemarlo.',
          image: null
        }
      ]
    },
    adulto: {
      name: 'Adulto',
      replies: [
        {
          id: 'teros_adulto_1',
          text: 'En este link hay información a su dieta y cuidados. Por favor leelo con tranquilidad: https://pajaros-caidos.blogspot.com/2010/01/dieta-teros.html?fbclid=IwAR2wljOAT6JiRAgOOgtFsN0kxa6pZGFFxMOiNwnDOVx8gFcDlP95yYX0ylA',
          image: null
        },
        {
          id: 'teros_adulto_2',
          text: 'Los teros son aves netamente insectívoras y SI O SI deben comer bichos todos los días. Los insectos contienen quitina que es fundamental en su alimentación.\n\nPodes darle: grillos, tenebrios, zophobas, cucarachas, larvas, gusanos, moscas, gusano de mosca, pequeñas arañas, bicho bolita, polillas, lombrices, etc siempre teniendo en cuenta que no hayan sido envenados.\n\nNO le des: arañas grandes o ponzoñosas, alacranes, avispas, abejas, cucarachas envenenadas, ni babosas (son venenosas).\n\nAcá tenés un video con cosas a tener en cuenta cuando encontramos un tero:\n\nhttps://www.facebook.com/refugio.de.aves.pajaros.caidos/videos/891470247602730/?hc_location=ufi\n\nCaporaletti envia bichos a todo el país, tanto grillos, zophobas, tenebrios, cucarachas. Al ser pequeñito, si le compras bichos grandes por ahi hay que cortarlos en pedacitos y darle como el video que te pase de Clara. Podes conseguir bichos en mercadolibre o en cualquier veterinaria grande especializada como en Centropet: http://www.grilloscapos.com.ar/',
          image: null
        }
      ]
    }
  }
};

// Auto-register this option
(function () {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('teros', REPLY_OPTION_TEROS);
  }
})();

