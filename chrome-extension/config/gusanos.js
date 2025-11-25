// Gusanos option configuration
var REPLY_OPTION_GUSANOS = {
  name: 'Gusanos',
  replies: [
    {
      id: 'gusanos_1',
      text: 'Lo que hay que hacer que hacer es buscar en todo su cuerpo granitos o bultitos que pudieran ser gusanos. Se necesita pervinox o yodopovidona de cualquier marca y una pincita de depilar o similar. En cada bultito se coloca un poco de Pervinox y si hay un gusano este se siente irritado por el pervinox y sale. Cuando se asoma hay que sacarlo sosteniendo firmemente y estirando suavemente así se sale el gusano, pero sin hacer fuerza, así el gusano no se rompe.\n\nhttps://www.youtube.com/watch?v=n1xow9QB-zs',
      image: 'gusano_1.png'
    },
    {
        id: 'gusanos_2',
        text: '',
        image: 'gusano_2.png'
      }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('gusanos', REPLY_OPTION_GUSANOS);
  }
})();

