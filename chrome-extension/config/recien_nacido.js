// Recién Nacido option configuration
var REPLY_OPTION_RECIEN_NACIDO = {
  name: 'Recién Nacido',
  replies: [
    {
      id: 'recien_nacido_1',
      text: 'Toda la información relacionada a su dieta y cuidados para su primera semana de vida la podés encontrar en el siguiente link. Como primer paso leelo con tranquilidad https://pajaros-caidos.blogspot.com/2010/01/pichones-recien-nacidos.html',
      image: 'recien_nacido.png'
    },
    {
      id: 'recien_nacido_2',
      text: 'Es importante saber que a esta edad las aves no pueden regular su temperatura, por ello hay que mantenerlas con calor. Una vez que ya están emplumadas pueden valerse por sí mismas, pero mientras tanto NUNCA puede faltar una fuente de calor externa.\n\nComen muy poquito cada 30 minutos. Así que hay que estar atentos y poder dedicarles tiempo. Hay que tener especial cuidado de no mandar la comida por el conducto de la respiración (las imágenes adjuntas explican esto muy bien)\n\nIMPORTANTE: esta dieta solo se aplica para la primera semana de vida del pichón. Hay que especificarle a la persona, que en la semana próxima debe hacer una nueva consulta para poder indicarle la nueva dieta y cuidados según la especie.',
      image: 'calor.png'
    },
    {
        id: 'recien_nacido_3',
        text: 'Hay que tener cuidado que no ingrese líquido por este conducto debajo de su lengua ya que lo utilizan para respirar',
        image: 'falsa_via.png'
      },
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('recien_nacido', REPLY_OPTION_RECIEN_NACIDO);
  }
})();

