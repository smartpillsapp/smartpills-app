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
  ],
  great: [
    "¡Casi lo clavas! Tienes más concentración que el que intenta rellenar la hoja de evolución mientras el paciente no para de hablar",
    "Muy bien! Has estado más fino y coordinado que el equipo de quirófano cuando el cirujano pide música para operar.",
    "Casi lo tienes! Tienes más precisión que la enfermera que te coge una vía difícil a la primera y sin encender la luz del box",
  ],
  meh: [
    "Bueno... tienes el mismo porcentaje de acierto que el pronóstico del tiempo",
    "Baja a la cafetería y tómate un cafecito, puedes hacerlo mejor",
    "Boh, Estás saliente de guardia? Te ví hacerlo mejor...",
  ],
  bad: [
    "Madre mía 0 aciertos, que alguien le quite el número de colegiado",
    "Hasta el alumno de primero podría hacerlo mejor",
    "0 aciertos?? Código café!! Esta persona necesita cafeína ya!!!",
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
