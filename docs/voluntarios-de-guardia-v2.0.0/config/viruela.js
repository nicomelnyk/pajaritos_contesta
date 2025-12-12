// Viruela option configuration
var REPLY_OPTION_VIRUELA = {
  name: 'Viruela',
  replies: [
  {
    id: 'viruela_1',
    text: 'NO LE ARRANQUES LOS GRANOS. Los granos se van secando con los días, gracias al yodo y se desprenden solos. Si los arrancamos antes de tiempo el sangrado es profuso y puede morir el ave de hemorragia o infección. Hay que tener paciencia y esperar que los granos sequen y se desprendan\n\nRecordá que debe ser iodo, no agua oxigenada (que produce quemadura del tejido sano y puede provocar ceguera si entra en los ojos) ni alcohol (que pica muchísimo y el ave puede morir de un paro cardíaco del dolor). Se mezcla 1 parte de yodo por una parte de solución fisiológica o agua limpia y se aplica a todos los granos, al menos 1 vez por día como mínimo, lo ideal es hacer curaciones 3 veces por día\n\nLas aves pueden estar en la misma habitación, pero NO deben compartir jaula, ni comedero, ni bebedero. Se le hace un recinto usando una caja grande con una ventana de mosquitero o tul. La viruela se contagia por contacto directo ave-ave, por saliva, heces, sangre... por eso si la paloma con viruela tiene piojos, moscas de las alomas o acaros, podría contagiar a las aves sanas, para eso le ponemos el mosquitero o tul, así no se salen los piojitos y lo mejor es siempre ponerles talco antiparasitario externo a las aves enfermas y a las sanas cuando rescatamos una palomita con viruela',
    image: null
  },
  {
    id: 'viruela_2',
    text: 'NO SE TRASMITE A LAS PERSONAS, sólo es contagiosaentre aves. En este link podés encontrar más información de la enfermedad https://pajaros-caidos.blogspot.com/2006/01/la-paloma-con-viruela-que-se-cur.html?fbclid=IwAR2GYyBe72At6ndKYeJCbzBHeRD2MVGAEZW9Ny5dlCNfJidDQW8wEyMU8NU',
    image: 'viruela.png'
    }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
  REPLY_OPTIONS_REGISTER('viruela', REPLY_OPTION_VIRUELA);
  }
})();

