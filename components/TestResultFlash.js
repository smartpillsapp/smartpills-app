import FullScreenFlash from "./FullScreenFlash";

const IMAGES = {
  perfect: "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20chulo.PNG",
  great:   "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20celebracion.png",
  meh:     "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20aburrido.PNG",
  bad:     "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20asustado%20.PNG",
};

const MESSAGES = {
  perfect: [
    "Pleno!!! Tienes más reflejos que el equipo de guardia escapando del paciente desorientado.",
    "Brutal!! Si fuese supervisor te daría el día libre.",
    "Espectacular!! No serás tú el nuevo Ramón y Cajal?",
    "Crack, máquina, mastodonte, fiera, número 1, campeón, titán, tiburón, tornado, huracán. Sigue así!",
    "Tratamiento completado con éxito, paciente dado de alta y sin secuelas. Ya te puedes quitar el pijama de principiante.",
    "Cuidado, que con tanto brillo en el expediente vas a cegar a la plantilla en la próxima guardia.",
    "5 de 5. Diagnóstico impecable. Espero que esta no sea la única vez en el mes que aciertes tanto a la primera.",
    "Ni una fisura. Voy a tener que empezar a pedirte consulta a ti.",
    "Pleno. O te has empollado el temario entero o tenías las respuestas apuntadas en la palma de la mano. No hay término medio.",
    "Estadísticamente esto roza el milagro. Confiesa: ¿a qué santo le has puesto una vela antes de darle a enviar?",
    "Un 5 de 5... Sospechoso. Voy a pedir un control antidoping de café y bebidas energéticas inmediatamente.",
    "Presumiendo de pleno, ¿eh? La mala noticia es que ahora no te voy a aceptar menos que esto en el siguiente.",
    "Había olvidado lo que era corregir a alguien que sabe de lo que habla. Qué agradable sorpresa.",
    "Perfecto. Te has ganado el derecho a mirar por encima del hombro al resto durante las próximas dos horas.",
  ],
  great: [
    "¡Casi lo clavas! Tienes más concentración que el que intenta rellenar la hoja de evolución mientras el paciente no para de hablar",
    "Muy bien! Has estado más fino y coordinado que el equipo de quirófano cuando el cirujano pide música para operar.",
    "Casi lo tienes! Tienes más precisión que la enfermera que te coge una vía difícil a la primera y sin encender la luz del box",
    "Bueno, el paciente sobrevive, pero se te va a la UCI un par de días. Hay que afinar más.",
    "Estás en esa zona gris donde no matas a nadie, pero tampoco le das el alta. Toca repasar.",
    "Casi lo tienes. Bien, pero ese fallo en un quirófano o en urgencias deja un recado importante. ¡A por el pleno!",
    "Suficiente para aprobar, insuficiente para presumir. Te has quedado a nada de la excelencia.",
    "Rozando el 80%... Ese error solitario te va a estar persiguiendo hasta el próximo examen, lo sabes.",
    "Estás en el aprobado de confort. Cómodo, sí, pero no nos confiemos que el azar hoy estaba de tu parte.",
    "Te ha faltado un pelo para colgarte la medalla. ¿De verdad vas a dejar que una sola pregunta te gane la partida?",
    "Casi perfecto. La mala noticia es que 'casi' no viste de gala. En el siguiente quiero el 5/5.",
    "Se nota que abriste el libro... lástima que te saltaras justo esa página.",
  ],
  meh: [
    "Bueno... tienes el mismo porcentaje de acierto que el pronóstico del tiempo",
    "Baja a la cafetería y tómate un cafecito, puedes hacerlo mejor",
    "Boh, Estás saliente de guardia? Te ví hacerlo mejor...",
    "Un 1 de 5... Se nota que le has puesto ganas, pero la dosis sigue siendo claramente subterapéutica.",
    "Bueno, al menos hemos encontrado el pulso. Está débil y rozando la muerte cerebral, pero pulso al fin y al cabo.",
    "Te ha salvado el instinto de supervivencia, porque lo que es el estudio no se ha visto por ninguna parte.",
    "Sinceramente, tirando un dardo con los ojos cerrados a la pantalla habríamos sacado mejor promedio.",
    "Un 20% de acierto. En el prospecto de tu examen esto contaría como 'efecto secundario muy raro'.",
    "Oye, ni tan mal: ya estás a cuatro respuestas correctas de parecer que sabes lo que haces.",
    "Me alegra ver que al menos le diste al botón de enviar sin fallar.",
    "Ese acierto me da la esperanza justa para no mandarte a repetir primero de carrera... pero por muy poco.",
    "Voy a asumir que estabas bajo los efectos de una guardia de 24 horas sin café, porque si no, no me lo explico.",
  ],
  bad: [
    "Madre mía 0 aciertos, que alguien le quite el número de colegiado",
    "Hasta el alumno de primero podría hacerlo mejor",
    "0 aciertos?? Código café!! Esta persona necesita cafeína ya!!!",
    "He visto éxitus con más actividad cerebral que tú...",
    "Menos mal que tus pacientes tienen buen sistema inmune, porque como dependan de tu marco teórico...",
    "Considera esto como tu dosis de recuerdo: toca repasar antes de volver a tocar a un paciente.",
    "Sacar un cero en un test de varias opciones requiere un talento casi matemático. Has esquivado la opción correcta con una precisión quirúrgica.",
    "Ni respondiendo tirando una moneda al aire se consigue una racha tan limpia. Tiene mérito lo tuyo.",
    "La parte buena es que no puedes ir a peor. Literalmente el único camino que te queda es subir.",
    "Dime que esto era un experimento social para ver cómo reaccionaba yo, por favor.",
  ],
};

function getTier(correct) {
  if (correct >= 5) return "perfect";
  if (correct >= 3) return "great";
  if (correct >= 1) return "meh";
  return "bad";
}

export default function TestResultFlash({ correct, onDismiss }) {
  const tier = getTier(correct);
  return (
    <FullScreenFlash
      image={IMAGES[tier]}
      messages={MESSAGES[tier]}
      onDismiss={onDismiss}
    />
  );
}
