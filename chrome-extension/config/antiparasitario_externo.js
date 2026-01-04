// Antiparasitario Externo option configuration
var REPLY_OPTION_ANTIPARASITARIO_EXTERNO = {
  name: 'Antiparasitario Externo',
  replies: [
    {
      id: 'antiparasitario_externo_1',
      text: 'Es frecuente que en algunas consultas las personas nos señalen que el ave tiene unos pequeños bichitos en su cuerpo. No es una señal de alarma, pero son molestos y se pueden eliminar con facilidad.\n\nEn las veterinarias venden insecticida para aves en polvo. No le pongas productos de perro o gato, pedí que sea PARA AVES. Hay de varias marcas, Ruminal, Holliday, Ecto Sin (Fiel) etc... Y en tu habitación si queres podes rociar con cualquier productos con base de piretrinas, que no es tóxico para ningún animal de sangre caliente (incluyéndonos)\n\nLos criadores de canarios le ponen una gota de limón (la fruta) en la cabecita, en el cuellito donde ellos no llegan a rascarse. Otra receta casera para los piojos de los chicos que no toleran el shampoo para los piojos, se sacan humedeciendo un algodón con vinagre de manzana.',
      image: 'antiparasitario_externo.png'
    }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('antiparasitario_externo', REPLY_OPTION_ANTIPARASITARIO_EXTERNO);
  }
})();

