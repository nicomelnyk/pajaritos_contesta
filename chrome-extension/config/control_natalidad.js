// Control Natalidad option configuration
var REPLY_OPTION_CONTROL_NATALIDAD = {
  name: 'Control Natalidad',
  replies: [
  {
    id: 'control_natalidad_1',
    text: 'Cuando tenemos aves de la misma especie y diferente sexo está la probabilidad de que tengan pichones, pero no todas las personas están dispuestas a aumentar el número de aves en su casa, por lo hay varios métodos que podemos utilizar para evitar que las aves se depriman al no tener pichones.\n\nUna opción es reemplazar los huevitos por huevos artificiales. Otra es hervirlos o batirlos (métodos que hacer que el huevito quede infértil). Hay que volver a ponerle el huevo a la paloma, para que la misma no siga poniendo huevos. Los va a incubar unos días, hasta que se da cuenta que no son fértiles y los abandonan o los tiran del nido. Marcarlos con un marcador (hacer un puntito o crucesita) para saber los que ya pasaron por control de natalidad y no confundirlos con los huevos nuevos que va poniendo).\n\nEste link está especificado para la paloma urbana pero los consejos se pueden aplicar para cualquier ave: http://pajaros-caidos.blogspot.com/2010/02/control-de-la-natalidad-en-palomas.html',
    image: null
  }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('control_natalidad', REPLY_OPTION_CONTROL_NATALIDAD);
  }
})();

