// Saca el link directo de «Escribir una reseña» de Google a partir de un link de Google Maps.
//
// Cómo funciona: los links largos de Maps traen el identificador del lugar en la forma
// 0xAAAA:0xBBBB (dentro de «!1s0x…:0x…» o de «ftid=0x…:0x…»). El Place ID de Google (el que empieza
// con ChIJ) es esos mismos dos números empaquetados en base64, así que se puede convertir
// sin llamar a ninguna API ni pagar nada.
// Comprobado con el ejemplo oficial de Google: 0x6b12ae37b47f5b37:0x8eaddfcd1b32ca52 = ChIJN1t_tDeuEmsRUsoyG83frY4

export const SHORT_HOSTS = ["maps.app.goo.gl", "goo.gl", "g.co"];

export function reviewUrl(placeId) {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

export function mapsUrl(placeId) {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
}

// 0xAAAA:0xBBBB → ChIJ…
export function featureIdToPlaceId(featureId) {
  const m = /^0x([0-9a-f]{1,16}):0x([0-9a-f]{1,16})$/i.exec(featureId || "");
  if (!m) return null;
  const bytes = [0x0a, 0x12, 0x09];
  const pushLE = (hex) => {
    let n = BigInt(`0x${hex}`);
    for (let i = 0; i < 8; i++) {
      bytes.push(Number(n & 0xffn));
      n >>= 8n;
    }
  };
  pushLE(m[1]);
  bytes.push(0x11);
  pushLE(m[2]);
  const bin = String.fromCharCode(...bytes);
  const b64 = typeof btoa === "function" ? btoa(bin) : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isShortLink(raw) {
  try {
    const u = new URL(raw.trim());
    return SHORT_HOSTS.includes(u.hostname.replace(/^www\./, ""));
  } catch {
    return false;
  }
}

// Nombre del lugar que viene en «/maps/place/Nombre+del+Lugar/…»
function placeName(text) {
  const m = /\/maps\/place\/([^/@?]+)/.exec(text);
  if (!m) return "";
  try {
    return decodeURIComponent(m[1].replace(/\+/g, " ")).trim();
  } catch {
    return m[1].replace(/\+/g, " ");
  }
}

// Lee un link (o texto pegado) de Maps. Devuelve { placeId, name, how } o { error }.
export function parseMapsLink(raw) {
  const text = (raw || "").trim();
  if (!text) return { error: "Pega un link de Google Maps." };

  // Puede venir pegado con texto alrededor (al compartir desde el celular): se toma la URL
  const urlMatch = /https?:\/\/\S+/.exec(text);
  const url = urlMatch ? urlMatch[0] : text;
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    // se queda como venía
  }
  const name = placeName(url);

  // Ya es un link de reseñas del dueño (g.page/r/…/review)
  if (/g\.page\/r\/[^/]+\/review/i.test(url)) {
    return { direct: url.replace(/[?#].*$/, ""), name, how: "Ya era un link de reseñas de Google." };
  }

  // Ya trae el Place ID (ChIJ…)
  const pid = /(?:place_id[:=]|placeid=|query_place_id=)(ChIJ[\w-]{20,})/i.exec(decoded);
  if (pid) return { placeId: pid[1], name, how: "El link ya traía el Place ID." };

  // Identificador 0x…:0x…; si hay varios, el del lugar es el que va después de «!1s»
  const fromData = /!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i.exec(decoded);
  const fromFtid = /ftid=(0x[0-9a-f]+:0x[0-9a-f]+)/i.exec(decoded);
  const any = /(0x[0-9a-f]{6,16}:0x[0-9a-f]{6,16})/i.exec(decoded);
  const feature = (fromData || fromFtid || any)?.[1];
  if (feature) {
    const placeId = featureIdToPlaceId(feature.toLowerCase());
    if (placeId) return { placeId, name, featureId: feature.toLowerCase(), how: "Calculado del identificador del lugar en el link." };
  }

  if (isShortLink(url)) return { short: url };

  if (/[?&]cid=\d+/.test(decoded)) {
    return { error: "Ese link solo trae el número del negocio (cid). Abre el lugar en Google Maps y copia el link completo de la barra de direcciones." };
  }
  if (!/google\.[a-z.]+\/maps|maps\.google\./i.test(url)) {
    return { error: "Eso no parece un link de Google Maps." };
  }
  return { error: "Ese link no trae el lugar exacto (puede ser una búsqueda o un mapa). Abre el negocio en Maps, toca Compartir y copia ese link." };
}
