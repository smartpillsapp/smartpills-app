// Las 10 ligas, en orden de menor a mayor
export const LEAGUES = [
  "Estudiantes",
  "Residentes",
  "Adjuntos novel",
  "Adjuntos senior",
  "Tutores de residentes",
  "Supervisores",
  "Jefes de servicio",
  "Coordinadores",
  "Directores generales",
  "Gerentes",
];

// Color del trofeo según la liga
export const LEAGUE_COLORS = {
  "Estudiantes":           "#A97142", // Bronce mate
  "Residentes":            "#C0C0C0", // Plata
  "Adjuntos novel":        "#FFD700", // Oro
  "Adjuntos senior":       "#E5E4E2", // Platino / Hielo
  "Tutores de residentes": "#50C878", // Verde esmeralda
  "Supervisores":          "#0047AB", // Azul cobalto
  "Jefes de servicio":     "#DC143C", // Rojo carmesí
  "Coordinadores":         "#B9F2FF", // Cian diamante
  "Directores generales":  "#6A0DAD", // Púrpura real
  "Gerentes":              "#87CEEB", // Diamante (renderizado con efecto especial)
};

export function getLeagueColor(league) {
  return LEAGUE_COLORS[league] || "#A97142";
}

// Imagen del trofeo según la liga
const LEAGUE_IMAGES = {
  "Estudiantes":           require("../assets/trofeo-estudiantes.png"),
  "Residentes":            require("../assets/trofeo-residentes.png"),
  "Adjuntos novel":        require("../assets/trofeo-adjuntos-novel.png"),
  "Adjuntos senior":       require("../assets/trofeo-adjuntos-senior.png"),
  "Tutores de residentes": require("../assets/trofeo-tutores-residentes.png"),
  "Supervisores":          require("../assets/trofeo-supervisores.png"),
  "Jefes de servicio":     require("../assets/trofeo-jefes-servicio.png"),
  "Coordinadores":         require("../assets/trofeo-coordinadores.png"),
  "Directores generales":  require("../assets/trofeo-directores.png"),
  "Gerentes":              require("../assets/trofeo-gerentes.png"),
};

export function getLeagueImage(league) {
  return LEAGUE_IMAGES[league] || LEAGUE_IMAGES["Estudiantes"];
}

// Calcula el tiempo restante hasta el reset (domingo 22:59 UTC)
export function getTimeUntilReset() {
  const now    = new Date();
  const target = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    22, 59, 0, 0
  ));

  const dayOfWeek = target.getUTCDay(); // 0 = domingo
  let daysToAdd   = (7 - dayOfWeek) % 7;

  if(daysToAdd === 0 && target.getTime() <= now.getTime()) {
    daysToAdd = 7;
  }
  target.setUTCDate(target.getUTCDate() + daysToAdd);

  const diffMs = target.getTime() - now.getTime();
  if(diffMs < 0) return "0m";

  const days  = Math.floor( diffMs / 86400000);
  const hours = Math.floor((diffMs %  86400000) / 3600000);
  const mins  = Math.floor((diffMs %   3600000) / 60000);

  if(days  > 0) return `${days}d ${hours}h`;
  if(hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
