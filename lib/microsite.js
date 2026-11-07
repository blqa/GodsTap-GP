export const DEFAULT_THEME = { bg: "#020617", accent: "#6366f1" };

export const PRESETS = [
  { name: "Oscuro", bg: "#020617", accent: "#6366f1" },
  { name: "Carbón", bg: "#18181b", accent: "#f59e0b" },
  { name: "Océano", bg: "#0c4a6e", accent: "#38bdf8" },
  { name: "Esmeralda", bg: "#022c22", accent: "#34d399" },
  { name: "Vino", bg: "#3b0a1e", accent: "#fb7185" },
  { name: "Claro", bg: "#f8fafc", accent: "#4f46e5" },
  { name: "Crema", bg: "#fef3c7", accent: "#b45309" },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

export function normalizeTheme(theme) {
  return {
    bg: HEX.test(theme?.bg) ? theme.bg : DEFAULT_THEME.bg,
    accent: HEX.test(theme?.accent) ? theme.accent : DEFAULT_THEME.accent,
  };
}

function rgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

export function brightness(hex) {
  const [r, g, b] = rgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// Texto oscuro sobre fondos claros, blanco sobre fondos oscuros
export function textOn(hex) {
  return brightness(hex) > 150 ? "#0f172a" : "#ffffff";
}

export function alpha(hex, a) {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Solo permite http/https (bloquea javascript:, data:, etc.)
export function getSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}