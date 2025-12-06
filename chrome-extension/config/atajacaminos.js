// Atajacaminos option configuration
var REPLY_OPTION_ATAJACAMINOS = {
  name: 'Atajacaminos',
  replies: [
  {
    id: 'atajacaminos_1',
    text: 'Los atajacaminos pertenecen al orden de los caprimulgiformes. Todos los Caprimúlgidos son aves de hábitos nocturnos y se alimentan principalmente insectos que capturan en el aire predominantemente de mariposas nocturnas escarabajos, polillas y todo tipo de insectos voladores grandes e invertebrados como larvas y lombrices, menos el guácharo (solamente habita en el Norte de Sudamérica) que se alimenta de frutos.',
    image: 'atajacamino_1.png'
  },
  {
    id: 'atajacaminos_2',
    text: 'Los atajacaminos son aves nocturnas como te mencioné antes, por lo que se alimentan de noche y duermen de día. Si encontraste al ave de día en el suelo y con los ojitos cerrados, es muy probable que sólo estuviera durmiendo y no lastimada o enferma.\n\nTe recomiendo que si la encontraste de día y realmente no tiene heridas aparentes, la vuelvas a dejar cerca del lugar donde la encontraste, en algún arbusto, lejos de depredadores y en algún sitio seguro SIEMPRE en el piso pues no tienen garras prensiles como otras aves rapaces y se pueden caer de cualquier ramita en la que se la quiera dejar.\n\nSi querés asegurarte bien de que realmente está sana y podés hacer una visita a un veterinario especialista en aves, lo mejor es llevarla con uno y luego resguardarla hasta la noche donde la podrás liberar idealmente donde la encontraste. Es dificil que sobrevivan en cautiverio por la dieta complicada que tienen, asi que lo mejor es devolverlos a la naturaleza.',
    image: 'atajacamino_2.png'
  }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('atajacaminos', REPLY_OPTION_ATAJACAMINOS);
  }
})();

