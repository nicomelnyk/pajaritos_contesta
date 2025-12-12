// Colibri option configuration
var REPLY_OPTION_COLIBRI = {
  name: 'Colibri',
  replies: [
  {
    id: 'colibri_1',
    text: '1.Resguardalo en caja (evitar accidentes)\n\nCUIDADO: Si se siente bien va a querer salir volando de golpe. Son sumamente veloces y en un instante puede chocarse contra un vidrio quebrándose el pico. Cerrá las ventanas con mosquitero o cortina. Que repose en una caja hasta evaluar su estado de salud. No dejar cerca vasos de agua. NO uses Ventilador. No dejar la caja en altura. No dejarlo con tus mascotas.\n\n2.REPUNTE\n\n❗️URGENTE: los minutos son críticos.\n\nPrepará:\n\n3 partes de agua\n\n1 parte de azúcar blanca COMÚN\n\nUsá de medición una tapita o cuchara medidora.\n\nPodés usar el agua de mate caliente y revolver para que el azúcar se disuelva.\n\nOfrecele la preparación a temperatura ambiente (ni fría de heladera ni caliente)\n\nCon la misma tapita o cuchara o jeringa sin aguja acercásela al pico. Va a sacar la lengua y va a tomar mucho. Dejalo descansar 15 minutos y volvé a ofrecerle.\n\n3.Contanos DE DÓNDE sos y en qué situación lo encontraste. Subí fotos y videos.\n\n4.Seguí los pasos anteriores. Luego leé la siguiente información:\n\nhttps://pajaros-caidos.blogspot.com/2023/02/alimentacion-para-colibries-turno.html\n\n5.❗️Solicitá por favor ingreso al GRUPO así te acompañamos, ya que la alimentación varía❗️\n\nhttps://www.facebook.com/groups/860979661773559',
    image: 'colibri.png'
  }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('colibri', REPLY_OPTION_COLIBRI);
  }
})();

