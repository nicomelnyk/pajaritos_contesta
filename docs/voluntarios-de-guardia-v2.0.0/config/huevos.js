// Huevos option configuration
var REPLY_OPTION_HUEVOS = {
  name: 'Huevos',
  replies: [
  {
    id: 'huevos_1',
    text: 'Incubar huevos es sumamente difícil, pero más difícil es sacar adelante pichones recién nacidos sin ayuda de sus padres. Comen dieta especial, cada 30 minutos, necesitan calor, necesitan los cuidados, atención, dedicación y amor, que para cualquier recién nacido. Si pensas que vas a tenes tiempo para ocuparte de ellos durante todo el día, durante la primer semana comen cada 30 minutos, luego cada 40 minutos, luego cada hora, y necesitan que les limpies el recinto y les des dieta y cuidados especiales. Si pensas que vas a disponer de tiempo y paciencia, podes intentar incubarlos. Sino lo mejor es dejar que se ocupen los padres. Trata de buscar el nido. No debe estar lejos de dónde lo encontraste. Quizás se desarmó. Podes probar armarlo con ramitas, para que no se caiga con el viento y cubrilo con ramitas, con pasto, con horas, para que esté lo más parecido a como estaba antes. Lo mejor es que los crien los papas. Si te vas a animas a incubar, podes pedir indicaciones y te las daremos. Te dejo el link de recién nacidos pára que leas como son los cuidados, pensa que son chiquitito, del tamaño del huevito, y vas a tener que alimentarlos todos los días cada 30 minutos sin ahogarlos.\n\nEste link esta pensado para pollitos pero puede resultarte útil: http://pajaros-caidos.blogspot.com/2010/02/como-puedo-cuidar-un-huevo-de-gallina.html',
    image: null
  }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('huevos', REPLY_OPTION_HUEVOS);
  }
})();




