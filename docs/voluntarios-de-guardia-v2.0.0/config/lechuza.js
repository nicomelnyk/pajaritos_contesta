// Lechuza option configuration
var REPLY_OPTION_LECHUZA = {
  name: 'Lechuza',
  subtypes: {
  pichon: {
    name: 'Pichón',
    replies: [
    {
      id: 'lechuza_pichon_1',
      text: 'Toda la información relacionada a lechuza la podés encontrar en el siguiente link. Como primer paso leelo con tranquilidad http://pajaros-caidos.blogspot.com/2010/01/dieta-de-las-distintas-lechuzas.html',
      image: null
    },
    {
      id: 'lechuza_pichon_2',
      text: 'Es importante que si tenes la posibilidad la dejes con sus padres porque mantener una lechuza en cautiverio es muy dificil, sobretodo por la dieta que llevan.\n\nComo es un pichón, vas a tener que darle toda la comida procesada. ¿Y que alimento? La lechuza es estrictamente carnívora y sus padres son los que los alimentan, le traen desde insectos como polillas, escarabajos, grillos, cucarachas, langostas y arañas entre otros invertebrados. También hay presas mas grandes como pequeños roedores, lauchas, lagartijas, ranas...\n\nLa carne roja como único alimento NO se les debe dar porque los descalcifica, lo que causa malformaciones en los huesos que son irreversibles. Sólo una o dos veces por semana se le puede dar complementada con calcio para aves o calcio de reptiles en polvo.\n\nComo verás, es muy dificil conseguir esas presas para alimentar al pichon correctamente, pero le podés dar:\n\n* Cogote y carcaza de pollo procesado con hueso, piel y todo (sin quitarle nada) CRUDO, FRESCO.\n\n* Suprema de pollo\n\n* Carne de conejo\n\n* Menudos de pollo (sólo 2 veces por semana )\n\n* Carne de codorniz\n\n* Carne ROJA MAGRA, (sin grasa) sólo complementando con calcio en polvo (aserrín de hueso puede ser, que podes pedirle al carnicero que te lo regale)\n\n* Alimento balanceado de perro en un tercio de su alimentación\n\nTodos los dias deben ingerir huesos, cartilagos, piel... ellos luego regurgitan lo que les sobra: piel y restos.',
      image: null
    }
    ]
  },
  adulto: {
    name: 'Adulto',
    replies: [
    {
      id: 'lechuza_adulto_1',
      text: 'Toda la información relacionada a lechuza la podés encontrar en el siguiente link. Como primer paso leelo con tranquilidad http://pajaros-caidos.blogspot.com/2010/01/dieta-de-las-distintas-lechuzas.html',
      image: null
    },
    {
      id: 'lechuza_adulto_2',
      text: 'Es fundamental dar calcio junto con la carne cruda, que debe tener tanto piel como pelos (ratas) o plumas (menudos, alas, cogote, cartilago de pollo), ellas comen ratas, ratones, estos se pueden comprar por internet.\n\nNo es bueno que coma sólo carne roja, porque se descalcifican, necesitan ingerir TODOS LOS DÍAS huesos, cartílagos, etc o sea presas enteras como ratones. Lo mejor es que lo tengan tranquilo, sin contacto humano, sólo lo molesten para darle de comer o limpiar su recinto. Si o si necesita comer ratones o pollitos: https://www.youtube.com/watch?v=pFfj5PwLjhI',
      image: null
    }
    ]
  }
  }
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('lechuza', REPLY_OPTION_LECHUZA);
  }
})();

