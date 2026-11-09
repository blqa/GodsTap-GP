// Horario del negocio. Se guarda como una lista de 7 textos, de lunes a domingo:
// "" = cerrado ese día, "09:00-18:00" = abre a las 9 y cierra a las 18 (hora de Ciudad de México).
// Si la hora de cierre es menor que la de apertura (ej. "18:00-02:00"), cierra después de medianoche.
// Si son iguales (ej. "00:00-00:00"), está abierto las 24 horas.

export const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const EMPTY_HOURS = ["", "", "", "", "", "", ""];

const RANGE = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;

export function parseRange(text) {
  const m = RANGE.exec(String(text || ""));
  if (!m) return null;
  return { open: Number(m[1]) * 60 + Number(m[2]), close: Number(m[3]) * 60 + Number(m[4]) };
}

// Devuelve la lista limpia de 7 días, o null si no hay ningún día con horario
export function cleanHours(hours) {
  if (!Array.isArray(hours)) return null;
  const list = EMPTY_HOURS.map((_, i) => (parseRange(hours[i]) ? String(hours[i]) : ""));
  return list.some(Boolean) ? list : null;
}

// 13:30 -> "1:30 p.m."
export function formatTime(minutes) {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${h < 12 ? "a.m." : "p.m."}`;
}

export function formatRange(text) {
  const r = parseRange(text);
  if (!r) return "Cerrado";
  if (r.open === r.close) return "24 horas";
  return `${formatTime(r.open)} – ${formatTime(r.close)}`;
}

// Día (0 = lunes) y minutos del día, en hora de Ciudad de México
export function mexicoNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Mexico_City",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || "";
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
  return { day: day < 0 ? 0 : day, minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}

// ¿Está abierto ahora? Devuelve { open, text, day }
export function hoursStatus(hours, date = new Date()) {
  const list = cleanHours(hours);
  if (!list) return null;
  const { day, minutes } = mexicoNow(date);
  const today = parseRange(list[day]);
  const yesterday = parseRange(list[(day + 6) % 7]);

  // Sigue abierto desde ayer (cierra después de medianoche)
  if (yesterday && yesterday.close < yesterday.open && minutes < yesterday.close) {
    return { open: true, day, text: `Abierto · cierra a las ${formatTime(yesterday.close)}` };
  }
  if (today) {
    if (today.open === today.close) return { open: true, day, text: "Abierto las 24 horas" };
    const overnight = today.close < today.open;
    if (minutes >= today.open && (overnight || minutes < today.close)) {
      return { open: true, day, text: `Abierto · cierra a las ${formatTime(today.close)}` };
    }
    if (minutes < today.open) {
      return { open: false, day, text: `Cerrado · abre hoy a las ${formatTime(today.open)}` };
    }
  }
  // Próximo día que abre
  for (let i = 1; i <= 7; i++) {
    const next = parseRange(list[(day + i) % 7]);
    if (!next) continue;
    const when = i === 1 ? "mañana" : `el ${DAY_NAMES[(day + i) % 7].toLowerCase()}`;
    return { open: false, day, text: `Cerrado · abre ${when} a las ${formatTime(next.open)}` };
  }
  return { open: false, day, text: "Cerrado" };
}
