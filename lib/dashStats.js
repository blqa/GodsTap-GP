// Cálculos del panel nuevo (/dashboard/nuevo) a partir de los documentos de scan_days.
// Cada documento es un día de un GT: { tag_id, day, count, clicks: { botón: n }, via: { nfc, qr, otro } }.
import { dayKey } from "@/lib/scans";

const DAY_MS = 86400000;
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// Lista de días (YYYY-MM-DD, hora de CDMX), del más viejo al más nuevo
export function lastDays(n, offset = 0, now = Date.now()) {
  const out = [];
  for (let i = n - 1 + offset; i >= offset; i--) out.push(dayKey(new Date(now - i * DAY_MS)));
  return out;
}

// Día de la semana (0 = domingo) de un "YYYY-MM-DD"
export function weekdayOf(key) {
  return new Date(`${key}T12:00:00Z`).getUTCDay();
}

export function weekdayName(i) {
  return WEEKDAYS[i];
}

export function shortDate(key) {
  const [, m, d] = key.split("-").map(Number);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${months[m - 1]}`;
}

function addMap(target, source) {
  if (!source || typeof source !== "object") return;
  Object.entries(source).forEach(([k, v]) => {
    target[k] = (target[k] || 0) + (Number(v) || 0);
  });
}

// Junta los documentos de los GT elegidos, día por día
function indexDocs(docs, tagIds) {
  const ids = new Set(tagIds);
  const byDay = {};
  docs.forEach((d) => {
    if (!ids.has(d.tag_id)) return;
    const day = (byDay[d.day] ||= { count: 0, clicks: {}, via: {} });
    day.count += Number(d.count) || 0;
    addMap(day.clicks, d.clicks);
    addMap(day.via, d.via);
  });
  return byDay;
}

function summarize(byDay, days) {
  const clicks = {};
  const via = { nfc: 0, qr: 0, otro: 0 };
  let total = 0;
  const series = days.map((key) => {
    const d = byDay[key];
    if (!d) return 0;
    total += d.count;
    addMap(clicks, d.clicks);
    addMap(via, d.via);
    return d.count;
  });
  return { total, series, clicks, via };
}

// Estadísticas de un periodo (7 o 30 días) contra el periodo anterior del mismo tamaño
export function periodStats(docs, tagIds, period) {
  const byDay = indexDocs(docs, tagIds);
  const days = lastDays(period);
  const prevDays = lastDays(period, period);
  const now = summarize(byDay, days);
  const prev = summarize(byDay, prevDays);

  const buttons = Object.entries(now.clicks)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  // Promedio por día de la semana, para decir cuál es su mejor día
  const sums = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  days.forEach((key, i) => {
    const w = weekdayOf(key);
    sums[w] += now.series[i];
    counts[w] += 1;
  });
  const avg = sums.map((s, i) => (counts[i] ? s / counts[i] : 0));
  const best = avg.reduce((b, v, i) => (v > avg[b] ? i : b), 0);

  return {
    days,
    series: now.series,
    total: now.total,
    prevTotal: prev.total,
    via: now.via,
    prevVia: prev.via,
    buttons,
    prevClicks: prev.clicks,
    bestDay: now.total > 0 ? best : null,
    bestAvg: avg[best] || 0,
  };
}

// Cambio en porcentaje contra el periodo anterior
export function delta(now, prev) {
  if (!prev && !now) return null;
  if (!prev) return { text: "Nuevo", up: true };
  const pct = Math.round(((now - prev) / prev) * 100);
  if (pct === 0) return { text: "Igual", up: null };
  return { text: `${pct > 0 ? "+" : ""}${pct}%`, up: pct > 0 };
}

export function nfcShare(via) {
  const known = (via?.nfc || 0) + (via?.qr || 0);
  if (!known) return null;
  return Math.round(((via.nfc || 0) / known) * 100);
}

export function fmt(n) {
  return Number(n || 0).toLocaleString("es-MX");
}
