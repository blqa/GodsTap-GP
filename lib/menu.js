// Menú de platillos de un GT: { sections: [{ title, items: [{ name, price, desc }] }], note }
export const MENU_LIMITS = { sections: 12, items: 80, title: 40, name: 60, desc: 140, price: 14, note: 200 };

export function countItems(menu) {
  return (menu?.sections || []).reduce((n, s) => n + (Array.isArray(s?.items) ? s.items.length : 0), 0);
}

// Limpia lo que escribió la persona: quita filas vacías y recorta textos. Devuelve null si no hay platillos.
export function cleanMenu(menu) {
  const sections = [];
  let total = 0;
  for (const s of Array.isArray(menu?.sections) ? menu.sections : []) {
    if (sections.length >= MENU_LIMITS.sections) break;
    const items = [];
    for (const it of Array.isArray(s?.items) ? s.items : []) {
      const name = String(it?.name || "").trim().slice(0, MENU_LIMITS.name);
      if (!name || total >= MENU_LIMITS.items) continue;
      const price = String(it?.price || "").trim().slice(0, MENU_LIMITS.price);
      const desc = String(it?.desc || "").trim().slice(0, MENU_LIMITS.desc);
      items.push({ name, price, desc });
      total++;
    }
    if (items.length) {
      sections.push({ title: String(s?.title || "").trim().slice(0, MENU_LIMITS.title) || "Menú", items });
    }
  }
  if (!sections.length) return null;
  const note = String(menu?.note || "").trim().slice(0, MENU_LIMITS.note);
  return { sections, note };
}

// "85" -> "$85", "85.5" -> "$85.50", "Desde $50" se queda igual
export function formatPrice(p) {
  const raw = String(p || "").trim();
  if (!raw) return "";
  const num = raw.replace(/^\$\s*/, "").replace(",", ".");
  if (/^\d+(\.\d{1,2})?$/.test(num)) {
    const n = Number(num);
    return "$" + (Number.isInteger(n) ? String(n) : n.toFixed(2));
  }
  return raw;
}

// Convierte texto pegado en secciones.
//   BEBIDAS            <- línea sin precio = sección
//   Café americano 35  <- línea que termina en número = platillo
//   Latte - 55 - Con leche de avena
//   Pastel | 60 | Rebanada   <- también se acepta con barras
export function parseMenuText(text) {
  const sections = [];
  let current = null;
  const ensure = () => {
    if (!current) {
      current = { title: "Menú", items: [] };
      sections.push(current);
    }
    return current;
  };
  for (const lineRaw of String(text || "").split(/\r?\n/)) {
    const line = lineRaw.trim();
    if (!line) continue;

    const parts = line.split(/\s*\|\s*/);
    if (parts.length >= 2) {
      ensure().items.push({ name: parts[0], price: parts[1].replace(/^\$\s*/, ""), desc: parts.slice(2).join(" ") });
      continue;
    }
    const dash = line.match(/^(.+?)\s+[-–—]\s+\$?\s*(\d+(?:[.,]\d{1,2})?)(?:\s+[-–—]\s+(.+))?$/);
    if (dash) {
      ensure().items.push({ name: dash[1], price: dash[2].replace(",", "."), desc: dash[3] || "" });
      continue;
    }
    const tail = line.match(/^(.+?)(?:\s+|\s*[-–—.:·]+\s*)\$?\s*(\d{1,5}(?:[.,]\d{1,2})?)$/);
    if (tail) {
      ensure().items.push({ name: tail[1], price: tail[2].replace(",", "."), desc: "" });
      continue;
    }
    // Sin precio: nueva sección
    current = { title: line.replace(/^#+\s*/, "").replace(/:$/, ""), items: [] };
    sections.push(current);
  }
  return sections.filter((s) => s.items.length);
}
