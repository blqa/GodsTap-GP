// Subida de imágenes sin servidor: se recortan y se comprimen en el navegador del cliente
// y se guardan como texto (data URL) dentro del propio documento del GT.

export const IMAGE_SPECS = {
  // Logo cuadrado (con fondo transparente si el navegador lo permite)
  logo: { w: 256, h: 256, maxChars: 60000, formats: ["image/webp", "image/png"], opaque: false },
  // Portada panorámica
  cover: { w: 1000, h: 420, maxChars: 190000, formats: ["image/webp", "image/jpeg"], opaque: true },
};

const MAX_FILE_BYTES = 15 * 1024 * 1024;

export function isStoredImage(value, kind) {
  // Imágenes de los micrositios de ejemplo (archivos propios del sitio, en /demo)
  if (typeof value === "string" && /^\/demo\/[a-z0-9-]+\.(jpg|png)$/.test(value)) return true;
  return (
    typeof value === "string" &&
    value.startsWith("data:image/") &&
    value.length <= (IMAGE_SPECS[kind]?.maxChars || 0) + 2000
  );
}

// Lee el archivo y lo deja listo para dibujar
export async function loadImage(file) {
  if (!file || !String(file.type).startsWith("image/")) throw new Error("Elige un archivo de imagen (JPG, PNG o WebP).");
  if (file.size > MAX_FILE_BYTES) throw new Error("La imagen pesa demasiado (máximo 15 MB).");
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // se intenta con el método clásico
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No pude abrir esa imagen. Prueba con una JPG o PNG."));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}

export function sourceSize(img) {
  return { w: img.naturalWidth || img.width, h: img.naturalHeight || img.height };
}

// Dibuja la imagen recortada al tamaño de salida. zoom ≥ 1; x e y entre 0 y 1 (0.5 = centrado)
export function drawCrop(ctx, img, outW, outH, { zoom = 1, x = 0.5, y = 0.5 } = {}) {
  const { w, h } = sourceSize(img);
  const scale = Math.max(outW / w, outH / h) * Math.max(1, zoom);
  const dw = w * scale;
  const dh = h * scale;
  ctx.drawImage(img, (outW - dw) * x, (outH - dh) * y, dw, dh);
}

// Genera el texto de la imagen y lo achica hasta que quepa en el límite
export function encodeImage(img, kind, crop) {
  const spec = IMAGE_SPECS[kind];
  let scale = 1;
  for (let attempt = 0; attempt < 7; attempt++) {
    const w = Math.max(32, Math.round(spec.w * scale));
    const h = Math.max(16, Math.round(spec.h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (spec.opaque) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.imageSmoothingQuality = "high";
    drawCrop(ctx, img, w, h, crop);
    for (const quality of [0.86, 0.74, 0.62, 0.5]) {
      for (const type of spec.formats) {
        const url = canvas.toDataURL(type, quality);
        if (!url.startsWith(`data:${type}`)) continue; // este navegador no sabe guardar en ese formato
        if (url.length <= spec.maxChars) return url;
      }
    }
    scale *= 0.82;
  }
  throw new Error("La imagen no se pudo comprimir lo suficiente. Prueba con otra.");
}
