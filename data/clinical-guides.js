// ════════════════════════════════════════════════════════════════════
//  GUÍAS CLÍNICAS de SmartPills
// ════════════════════════════════════════════════════════════════════
//
//  IMPORTANTE: SmartPills NO aloja los PDFs. Solo enlaza a la fuente
//  original. Esto es por motivos legales de derechos de autor.
//
// ─── CÓMO AÑADIR UNA GUÍA NUEVA ─────────────────────────────────────
//
//  1) Genera un UUID único. Tienes dos opciones:
//     - En la terminal del Mac escribe:  uuidgen
//     - O entra en:  https://www.uuidgenerator.net/version4
//
//  2) Copia uno de los objetos de abajo, pégalo al final del array
//     (antes del corchete ]) y rellena los campos.
//
//  3) Guarda el archivo. La app lo recoge automáticamente.
//
// ─── CAMPOS DE CADA GUÍA ────────────────────────────────────────────
//
//   id              UUID único (NO repetir entre guías)
//   titulo          Título completo de la guía
//   sociedad        Sociedad/organización (ESC, AHA, GOLD, NICE, OMS...)
//   idioma          "ingles"  o  "castellano"
//   especialidades  Lista de especialidades, ej: ["Cardiología", "Urgencias"]
//   url             Enlace a la fuente original (donde está el PDF)
//   imagen          URL de imagen ilustrativa (opcional)
//   resumen         Texto de 60-80 palabras centrado en los cambios
//                   y novedades relevantes respecto a la versión anterior
//
// ════════════════════════════════════════════════════════════════════

export const CLINICAL_GUIDES = [
  {
    id:             "5d8a3f72-9b1e-4d2c-a5f6-c8b3e9d7f421",
    titulo:         "ESC Guidelines for Heart Failure 2023",
    sociedad:       "ESC",
    idioma:         "ingles",
    especialidades: ["Cardiología"],
    url:            "https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/Acute-and-Chronic-Heart-Failure",
    imagen:         "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800&q=90",
    resumen:        "Actualización focalizada que amplía la indicación de los inhibidores SGLT2 (dapagliflozina, empagliflozina) a pacientes con fracción de eyección ligeramente reducida y preservada, completando su recomendación previa para HFrEF. Refuerza el cribado sistemático de amiloidosis cardíaca y actualiza el tratamiento del déficit de hierro con carboximaltosa férrica intravenosa. Incorpora nuevas pautas en comorbilidades habituales (diabetes, enfermedad renal crónica, obesidad) y ajusta el seguimiento ambulatorio tras hospitalización por descompensación.",
  },
  {
    id:             "7e1c9d45-3f82-4a6b-b7d8-e5c2f9a1b384",
    titulo:         "GOLD — Estrategia global para EPOC 2024",
    sociedad:       "GOLD",
    idioma:         "castellano",
    especialidades: ["Neumología", "Atención Primaria"],
    url:            "https://goldcopd.org",
    imagen:         "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=90",
    resumen:        "La edición 2024 consolida la herramienta de evaluación ABE introducida en 2023, que sustituyó al sistema ABCD simplificando la clasificación inicial según síntomas e historia de exacerbaciones. Refuerza el uso de la triple terapia inhalada en pacientes seleccionados con exacerbaciones frecuentes y eosinofilia. Actualiza las recomendaciones de vacunación e introduce consideraciones sobre vapeo. Incluye nuevas evidencias sobre rehabilitación pulmonar precoz tras el alta hospitalaria y precisa los criterios de oxigenoterapia ambulatoria.",
  },
  {
    id:             "3c9f7a18-5b4e-4d2a-9c6f-8e1b3d5a7c92",
    titulo:         "AHA/ASA Stroke Guidelines 2024",
    sociedad:       "AHA",
    idioma:         "ingles",
    especialidades: ["Neurología", "Urgencias"],
    url:            "https://www.heart.org/en/professional/quality-improvement",
    imagen:         "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&q=90",
    resumen:        "Recomendaciones actualizadas que amplían la ventana de la trombectomía mecánica hasta 24 horas en pacientes seleccionados mediante neuroimagen avanzada (perfusión por TC o RM). Tenecteplasa pasa a considerarse alternativa razonable a alteplasa para la trombolisis intravenosa. Refuerza el papel de las unidades de ictus y la atención prehospitalaria coordinada. Incorpora nuevas pautas de prevención secundaria con anticoagulantes orales directos y revisa el manejo de la presión arterial en la fase aguda.",
  },
];
