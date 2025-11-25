// Repunte option configuration
var REPLY_OPTION_REPUNTE = {
  name: 'Repunte',
  replies: [
    {
      id: 'repunte_1',
      text: 'Cuando nos encontramos a un ave con la cabeza agachada, las plumas erizadas, ojos cerrados todo el tiempo y apenas responde a nuestra intervención o se resiste es mala señal. Claramente algo le está sucediendo y necesita recurrir a un veterinario especialista en aves lo antes posible, pero mientras tanto podemos ayudarla a repuntar hasta saber con exactitud qué le sucede. También se utiliza cuando encontramos un ave hipotérmica e hipoglucémica, deshidratada, débil y que pasó muchas horas sin comer.\n\nCuando nos encontramos con un ave débil solemos recomendar una terapia para que el ave pueda repuntar. Te paso el procedimiento:\n\n1) Vamos a brindarle una fuente de calor directo. Podemos usar botellas plásticas rellenas con agua caliente de la canilla, que no queme, para que al contacto normalice la temperatura corporal.\n\n2) Vamos a proporcionarle AGUA GLUCOSADA. Lo mejor es el gatorade tibio. Si no tenemos Gatorade, podemos preparar 1 vaso de agua limpia tibia, con una cucharada de azúcar blanca común o miel y una pizca de sal que aporta electrolitos. Mojamos un trocito de algodón o gasa en el líquido glucosado y goteamos con cuidado en el pico del ave para que beba sin ahogarse, esto hidrata, reactiva, revierte la hipoglucemia y estabiliza al ave.\n\n3) Dejar descansar de 15 a 30 minutos\n\n4) Limpiar la cloaca con agua tibia y paño húmedo, quitando todo resto de excremento seco que bloquee sistema digestivo impidiendo defecar\n\n5) Empezar a alimentar, al principio raciones muy pequeñas de alimento blando y tibio (papilla) controlar como hace la digestión: si baja el buche y defeca, para dar más alimento a medida que se restablece la capacidad de digerir.',
      image: 'calor.png'
    }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('repunte', REPLY_OPTION_REPUNTE);
  }
})();

