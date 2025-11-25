// Paramixovirus option configuration
var REPLY_OPTION_PARAMIXOVIRUS = {
  name: 'Paramixovirus',
  replies: [
    {
      id: 'paramixovirus_1',
      text: 'Parece que tuviera paramixovirus, pero el diagnostico debe darlo el veterinario. Si fuera PMV, es un virus AVIAR, que se contagia entre aves por los fluidos (saliva, heces) y no se contagia a los mamiferos (humanos, perros, gatos).\n\nSe debe tener al ave aislada de otras aves, no debe compartir ni comedero ni bebedero. Vamos a limpiar muy seguido, que no se junte caca, porque es un ave con las defensas bajas propensa a infecciones o enfermedades oportunistas. Nos lavamanos bien las manos antes y después de atender al ave, por la salud del ave que podemos afectar si tenemos manos contaminadas con suciedad y de otras aves que tengamos en casa si diseminamos el virus; también lavar con chorrito de lavandina comedero, bebedero, palitos, etc. El excremento lo descartamos en bolsita cerrada y no lo tiramos al patio donde otras aves comen restitos de semillas del ave enferma, enfermando.\n\nEl virus dura 21 días, pero recomendamos aislar al ave de otras aves por 40 días o más. En esa etapa la alimentamos como si fuera pichón: tanto con papilla (que aporta sólidos y líquidos) como con semillas porque en ese estado NO COMEN SOLAS o no comen lo suficiente y se debilitan. Debe ir al médico veterinario especialista en aves que de acuerdo a su criterio le dará el tratamiento. La recuperación del ave depende del sistema inmunológico del ave, si el ave está fuerte, sale adelante, si no está fuerte decae y tiene complicaciones. ¿Cómo ayudamos? Teniendo al ave en lugar seguro, cómodo y LIMPIO, dandole alimento adecuado en tiempo y forma, brindándole la medicación que él veterinario nos prescribe, de la forma en que lo indica y controlando que no haya complicaciones, porque recordemos que es un ave inmunosuprimida, cuyas defensas están luchando con el virus y si ingresa una nueva amenaza está en desventaja.\n\nCon tratamiento hay chances de que el ave quede sin secuelas y pueda ser libre, pero sin tratamiento, sin alimentación, sin ayuda puede morir. El ave no muere por el virus en sí, muere porque la sintomatología neurológica le impide alimentarse por sí misma y volar para huir de depredadores, o de enfermedades oportunistas (infección, tricomonas, coccidios, etc, etc).\n\nPor otro lado no la vamos a exponer a luz directa fuerte (sol o luces fuertes) porque tienen las pupilas dilatadas que no reaccionan naturalmente a la luz contrayéndose (como debería pasar) y puede quedar ciega. Pero tampoco hay que dejarla en oscuridad total o en una caja cerrada.\n\nLa papilla para paloma: En el caso de que te costara darle la papilla de nestum+balanceado porque se te tape la jeringa o algo también podés darselo por separado. Nestum multicereal sólo, y por otro lado unos 4 pellets de balanceado previamente remojado, eso es como te sea más fácil y práctico a vos.\n\nSe van incorporando las semillas de a poco para ver como las digiere. Si hace mucha diarrea o tarda mucho en bajarle el buche no le des más semillas. Igualmente todo esto te lo indicará mejor el veterinario especialista según cómo la vea, es muy importante que la lleves en cuanto puedas.\n\nVIDEO: Cómo darle de comer a paloma que no se alimenta sola\n\nhttps://www.youtube.com/watch?v=k3bRR6tV_JQ',
      image: null
    }
  ]
};

// Auto-register this option
(function() {
  if (typeof REPLY_OPTIONS_REGISTER === 'function') {
    REPLY_OPTIONS_REGISTER('paramixovirus', REPLY_OPTION_PARAMIXOVIRUS);
  }
})();

