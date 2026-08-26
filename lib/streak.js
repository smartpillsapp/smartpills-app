// Lógica de racha con vacunas y días de hielo.
//
// Estado en la tabla profiles:
//   - streak_days        (array) — fechas con test completado (🔥)
//   - streak_vaccines    (array) — fechas donde se usó una vacuna (💉)
//   - ice_days           (array) — fechas con racha rota (❄️)
//   - vaccines_remaining (int)   — vacunas disponibles (0-2)
//   - racha_dias         (int)   — contador actual de racha
//   - ultima_vez_test    (date)  — último día con test diario completado o vacuna aplicada

import { supabase } from "./supabase";

export const MAX_VACCINES = 2;
const STREAK_MILESTONE   = 30;

// Icono de vacuna (PNG con fondo transparente)
export const VACCINE_ICON_URL =
  "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/vaccine-injection-protection-icon-vector-removebg-preview.png";

// Versión blanco y negro para vacunas gastadas
export const VACCINE_ICON_BW_URL =
  "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Gemini_Generated_Image_h2j7x4h2j7x4h2j7-removebg-preview.png";

function toDateStr(d) {
  if(typeof d === "string") return d.split("T")[0];
  return new Date(d).toISOString().split("T")[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function dayMs(dateStr) {
  return new Date(dateStr + "T00:00:00Z").getTime();
}

// Fechas estrictamente entre `from` (exclusivo) y `to` (exclusivo)
function gapDates(fromStr, toStr) {
  const dates = [];
  let cursor = addDays(fromStr, 1);
  while(dayMs(cursor) < dayMs(toStr)) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

// Procesa días "huecos" entre la última actividad y hoy.
// Devuelve un objeto con los campos del perfil a actualizar, o null si no hay nada.
export function processStreakGap(profile) {
  if(!profile?.ultima_vez_test) return null;

  const todayStr    = toDateStr(new Date());
  const lastTestStr = toDateStr(profile.ultima_vez_test);
  const gap         = gapDates(lastTestStr, todayStr);
  if(gap.length === 0) return null;

  let vaccines       = profile.vaccines_remaining ?? MAX_VACCINES;
  const streakVaxs   = Array.isArray(profile.streak_vaccines) ? [...profile.streak_vaccines] : [];
  const iceDays      = Array.isArray(profile.ice_days)        ? [...profile.ice_days]        : [];
  let racha          = profile.racha_dias || 0;
  let streakLost     = false;
  let lastVaccineUsed = null;
  let streakBroken    = false;

  for(const day of gap) {
    if(streakLost) {
      iceDays.push(day);
    } else if(vaccines > 0) {
      streakVaxs.push(day);
      vaccines -= 1;
      racha    += 1;
      lastVaccineUsed = day;
    } else {
      iceDays.push(day);
      racha       = 0;
      streakLost  = true;
      streakBroken = true;
    }
  }

  const lastProcessedDay = gap[gap.length - 1];

  const updates = {
    streak_vaccines:    streakVaxs,
    ice_days:           iceDays,
    vaccines_remaining: vaccines,
    racha_dias:         racha,
    ultima_vez_test:    lastProcessedDay,
  };

  // Marcar flash pendiente según lo que ocurrió
  if(lastVaccineUsed) {
    updates.pending_vaccine_flash = lastVaccineUsed;
  }
  if(streakBroken) {
    updates.pending_streak_lost_flash = true;
  }

  return updates;
}

// Llamar al cargar la app/pantalla: aplica gap si hace falta y persiste.
// Devuelve el perfil actualizado (o el mismo si no hubo cambios).
export async function ensureStreakState(profile, authUserId) {
  const updates = processStreakGap(profile);
  if(!updates) return profile;
  try {
    await supabase.from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("auth_user_id", authUserId);
  } catch(err) {
    console.warn("ensureStreakState:", err?.message);
    return profile;
  }
  return { ...profile, ...updates };
}

// Al completar el reto diario: devuelve los campos a actualizar (no persiste).
// Aplica:
//   - añadir hoy a streak_days
//   - racha += 1 (o = 1 si no era consecutivo)
//   - hito de 30 días → +1 vacuna (cap 2)
export function applyDailyTestCompletion(profile) {
  const todayStr   = toDateStr(new Date());
  const yesterday  = addDays(todayStr, -1);
  const lastTest   = profile?.ultima_vez_test ? toDateStr(profile.ultima_vez_test) : null;
  const oldRacha   = profile?.racha_dias || 0;

  let newRacha;
  if(lastTest === todayStr) {
    newRacha = oldRacha || 1;
  } else if(lastTest === yesterday) {
    newRacha = oldRacha + 1;
  } else {
    newRacha = 1; // fallback (no debería pasar si se llamó a ensureStreakState antes)
  }

  const streakDays = Array.isArray(profile?.streak_days) ? [...profile.streak_days] : [];
  if(!streakDays.includes(todayStr)) streakDays.push(todayStr);

  // Si la racha arranca desde 0 (cuenta nueva o reenganche tras rotura),
  // damos el kit completo de vacunas. Así el usuario tiene 2 vacunas
  // disponibles cada vez que empieza una racha nueva.
  let vaccines = profile?.vaccines_remaining ?? MAX_VACCINES;
  const startingFromZero = oldRacha === 0;
  if(startingFromZero) vaccines = MAX_VACCINES;

  // Hito de 30 días → +1 vacuna (cap 2)
  const crossedMilestone =
    Math.floor(newRacha / STREAK_MILESTONE) > Math.floor(oldRacha / STREAK_MILESTONE);
  if(crossedMilestone && vaccines < MAX_VACCINES) vaccines += 1;

  return {
    streak_days:        streakDays,
    vaccines_remaining: vaccines,
    racha_dias:         newRacha,
    ultima_vez_test:    todayStr,
  };
}
