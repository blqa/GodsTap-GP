// Ayudas para los botones de acción del micrositio: llamar, SMS, correo, contacto y WiFi.
import { getSafeUrl } from "@/lib/microsite";
import { kindOf } from "@/lib/linkIcons";

// Deja el teléfono como +521234567890. Con 10 dígitos se asume México (+52).
export function normalizePhone(input) {
  const raw = String(input || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (raw.startsWith("+")) return "+" + digits;
  if (digits.length === 10) return "+52" + digits;
  return "+" + digits;
}

export function isValidPhone(normalized) {
  return /^\+\d{8,15}$/.test(normalized);
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

// Para mostrar en el editor: quita tel:, sms: o mailto:
export function stripScheme(url) {
  return String(url || "").replace(/^(tel|sms|mailto):/i, "");
}

// Enlace final de un botón (null si no es válido). Contacto y WiFi no llevan enlace.
export function linkHref(link) {
  const kind = kindOf(link?.icon);
  const raw = stripScheme(link?.url).trim();
  if (kind === "phone") {
    const p = normalizePhone(raw);
    return isValidPhone(p) ? `${link.icon === "sms" ? "sms" : "tel"}:${p}` : null;
  }
  if (kind === "email") return isValidEmail(raw) ? `mailto:${raw}` : null;
  if (kind === "url" || kind === "pay") return getSafeUrl(link?.url);
  return null;
}

function esc(s) {
  return String(s || "").replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

// Tarjeta de contacto (.vcf) para guardar en el celular
export function buildVCard({ name, phone, email, org }) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(name)}`,
    org ? `ORG:${esc(org)}` : null,
    phone ? `TEL;TYPE=CELL:${normalizePhone(phone)}` : null,
    email ? `EMAIL:${esc(email)}` : null,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");
}

// CLABE interbancaria: 18 dígitos con dígito verificador (para detectar errores al escribirla)
export function cleanDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function isValidClabe(value) {
  const d = cleanDigits(value);
  if (d.length !== 18) return false;
  const w = [3, 7, 1];
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += ((Number(d[i]) * w[i % 3]) % 10);
  return (10 - (sum % 10)) % 10 === Number(d[17]);
}

// 012 345 67890123456 7 (solo para mostrarla; al copiar van los 18 dígitos juntos)
export function formatClabe(value) {
  const d = cleanDigits(value);
  if (d.length !== 18) return String(value || "");
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 17)} ${d.slice(17)}`;
}

export function formatCard(value) {
  const d = cleanDigits(value);
  return d.length === 16 ? d.replace(/(\d{4})(?=\d)/g, "$1 ") : String(value || "");
}
