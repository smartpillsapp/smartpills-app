// Banco local de palabras + pistas. Sirve como fallback si Supabase falla.
// El juego intentará primero cargar desde la tabla `hangman_words` (más amplia y
// editable sin nuevo deploy). Si no hay conexión o la tabla está vacía,
// usa esta lista mínima para que el juego siga jugable.
export const FALLBACK_WORDS = [
  { word: "CORAZON",  hint: "Órgano que bombea sangre por el cuerpo" },
  { word: "JERINGA",  hint: "Instrumento médico para inyectar fluidos" },
  { word: "VACUNA",   hint: "Inmunización que previene enfermedades infecciosas" },
  { word: "HOSPITAL", hint: "Centro sanitario donde se ingresan pacientes" },
  { word: "FIEBRE",   hint: "Aumento de la temperatura corporal por encima de lo normal" },
  { word: "CIRUJANO", hint: "Médico especializado en realizar operaciones" },
  { word: "PACIENTE", hint: "Persona que recibe atención médica" },
  { word: "INSULINA", hint: "Hormona que regula el nivel de azúcar en sangre" },
  { word: "NEUMONIA", hint: "Infección que inflama los sacos de aire del pulmón" },
  { word: "SUTURA",   hint: "Costura quirúrgica para cerrar una herida" },
];
