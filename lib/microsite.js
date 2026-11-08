export const DEFAULT_THEME = { bg: "#020617", accent: "#6366f1" };

// Plantillas listas: cada una trae colores, tipografía, forma de botones y animación. Todo se puede cambiar después.
export const PRESETS = [
  { name: "Oscuro", bg: "#020617", accent: "#6366f1" },
  { name: "Carbón", bg: "#18181b", accent: "#f59e0b" },
  { name: "Océano", bg: "#0c4a6e", accent: "#38bdf8", fx: "bubbles" },
  { name: "Esmeralda", bg: "#022c22", accent: "#34d399" },
  { name: "Vino", bg: "#3b0a1e", accent: "#fb7185", font: "serif" },
  { name: "Medianoche", bg: "#0b1026", accent: "#a78bfa", fx: "sparkles", shape: "pill" },
  { name: "Atardecer", bg: "#2a0f1f", accent: "#fb923c", fx: "sparkles", font: "rounded", shape: "pill" },
  { name: "Bosque", bg: "#14231a", accent: "#a3e635", font: "serif" },
  { name: "Café", bg: "#231710", accent: "#d6a56b", fx: "none", font: "serif", shape: "square" },
  { name: "Neón", bg: "#09090b", accent: "#22d3ee", fx: "sparkles", font: "mono", shape: "square" },
  { name: "Chicle", bg: "#2b0b24", accent: "#f472b6", fx: "bubbles", font: "rounded", shape: "pill" },
  { name: "Claro", bg: "#f8fafc", accent: "#4f46e5" },
  { name: "Crema", bg: "#fef3c7", accent: "#b45309", font: "serif" },
  { name: "Menta", bg: "#ecfdf5", accent: "#059669", fx: "bubbles", font: "rounded", shape: "pill" },
  { name: "Cielo", bg: "#eff6ff", accent: "#2563eb", fx: "bubbles" },
  { name: "Lavanda", bg: "#f5f3ff", accent: "#7c3aed", fx: "sparkles", font: "rounded" },
  { name: "Arena", bg: "#f5efe6", accent: "#9a3412", fx: "none", font: "serif", shape: "square" },
  { name: "Blanco y negro", bg: "#ffffff", accent: "#111827", fx: "none", shape: "square" },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

// Animación del fondo. "particles" es la de siempre; las otras se eligen en el editor.
export const FX_STYLES = [
  { value: "particles", label: "Partículas" },
  { value: "bubbles", label: "Burbujas" },
  { value: "sparkles", label: "Destellos" },
  { value: "none", label: "Sin animación" },
];
export const DEFAULT_FX = "particles";

// Tipografías (del sistema: no se descarga nada, la página carga igual de rápido)
export const FONTS = [
  { value: "sans", label: "Moderna", stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { value: "serif", label: "Elegante", stack: 'ui-serif, Georgia, Cambria, "Times New Roman", serif' },
  { value: "rounded", label: "Redondeada", stack: 'ui-rounded, "SF Pro Rounded", "Nunito", "Quicksand", "Segoe UI", system-ui, sans-serif' },
  { value: "mono", label: "Técnica", stack: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
];
export const DEFAULT_FONT = "sans";

// Forma de los botones
export const SHAPES = [
  { value: "round", label: "Redondeados", radius: 16 },
  { value: "pill", label: "Cápsula", radius: 999 },
  { value: "square", label: "Cuadrados", radius: 6 },
];
export const DEFAULT_SHAPE = "round";

export function fontStack(font) {
  return (FONTS.find((f) => f.value === font) || FONTS[0]).stack;
}

export function shapeRadius(shape) {
  return (SHAPES.find((s) => s.value === shape) || SHAPES[0]).radius;
}

export function normalizeTheme(theme) {
  return {
    bg: HEX.test(theme?.bg) ? theme.bg : DEFAULT_THEME.bg,
    accent: HEX.test(theme?.accent) ? theme.accent : DEFAULT_THEME.accent,
    fx: FX_STYLES.some((f) => f.value === theme?.fx) ? theme.fx : DEFAULT_FX,
    font: FONTS.some((f) => f.value === theme?.font) ? theme.font : DEFAULT_FONT,
    shape: SHAPES.some((s) => s.value === theme?.shape) ? theme.shape : DEFAULT_SHAPE,
  };
}

// Lo que se guarda en Firestore: solo se escribe lo que no es el valor de siempre
export function themeForSave(theme) {
  const t = normalizeTheme(theme);
  return {
    bg: t.bg,
    accent: t.accent,
    ...(t.fx !== DEFAULT_FX ? { fx: t.fx } : {}),
    ...(t.font !== DEFAULT_FONT ? { font: t.font } : {}),
    ...(t.shape !== DEFAULT_SHAPE ? { shape: t.shape } : {}),
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