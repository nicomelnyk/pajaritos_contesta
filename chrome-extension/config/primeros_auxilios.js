// Primeros Auxilios option configuration
var REPLY_OPTION_PRIMEROS_AUXILIOS = {
  name: 'Primeros Auxilios',
  replies: [
    {
      id: 'primeros_auxilios_1',
      text: 'Si encontras un ave que ha sido atacada por un gato debes ir urgente al médico veterinario especialista en aves. El gato tiene el instinto de cazar y se siente atraído por cualquier cosa que se mueva, especialmente si revolotea. Existen bacterias en la saliva y en las garras del gato, estas bacterias son parte de la flora bacteriana natural del gato y son inofensivas para este, pero son MORTALES para las aves. Incluso una interacción "amigable" entre ave y gato puede ser mortal para el ave (si el gato lame al ave o el ave acicala al gato, es suficiente para que el ave sea afectada y esté en riesgo enfermar y morir).\n\nSi el ave fue mordida por un gato, necesita tomar antibióticos por vía oral SI o Si, sin excepciones. Necesita ir al veterinario especialista en aves, que indicará el tratamiento con antibióticos adecuado al tipo de ave, edad, peso, etc. El ave aparenta estar bien, come, camina, vuela, etc y mientras las bacterias invaden su cuerpo (septicemia) de repente el ave convulsiona y muere; esto ocurre a las 24hs /72hs tras el ataque de gato o interacción entre ambos. Por eso es MUY IMPORTANTE que tome antibióticos, especialmente si el ave estuvo en las garras del gato o en su boca. Algo similar ocurre con los perros: hasta el perro más dócil, puede reaccionar instintivamente y lastimar a un ave, por eso no hay que arriesgarse, no exponer nunca a las aves "mascota" con nuestros perros o gatos. Tanto la saliva de perro, como la saliva de gato, son mortales para las aves.\n\nSi el ave estuvo en la boca de un perro o gato hay que limpiarla con pervinox (yodopovidona), diluida en agua al 50 % (mitad yodo, mitad agua tibia), repasamos todas sus heridas, su piel, sus plumas, tratando de eliminar toda la contaminación con saliva. Mientras tanto mantenela calentita, ya que tiene las defensas bajas para regular la temperatura por su cuenta.',
      image: 'calor.png'
    },
    {
      id: 'primeros_auxilios_2',
      text: 'En este link podrás encontrar más información https://pajaros-caidos.blogspot.com/2010/01/primeros-auxilios-en-aves.html',
      image: null
    }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('primeros_auxilios', REPLY_OPTION_PRIMEROS_AUXILIOS);
  }
})();

