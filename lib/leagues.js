// Las 10 ligas, en orden de menor a mayor
export const LEAGUES = [
  "Estudiantes",
  "Residentes",
  "Adjuntos novel",
  "Adjuntos senior",
  "Tutores de residentes",
  "Supervisores",
  "Jefes de servicio",
  "Coordinadores de cuidados",
  "Directores de cuidados",
  "Gerentes",
];

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
