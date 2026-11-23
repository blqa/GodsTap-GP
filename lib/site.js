// Dominio de GodsTap · by God’s Plan. Si algún día cambia el dominio, se cambia SOLO aquí.
export const DOMAIN = "godsplan.dev";

// Dirección pública de GodsTap (la que va grabada en los chips: BASE_URL/t/<id>)
export const SITE_HOST = `godstap.${DOMAIN}`;
export const BASE_URL = `https://${SITE_HOST}`;

// Página de la agencia
export const AGENCY_URL = `https://${DOMAIN}`;

// Direcciones viejas de GodsTap. Los GT creados antes del cambio de dominio guardaron
// estas direcciones como "sin configurar"; se siguen reconociendo como tal.
export const LEGACY_BASE_URLS = ["https://godstap.godsplan.site"];

export function isBaseUrl(url) {
  const clean = (url || "").replace(/\/$/, "");
  return clean === BASE_URL || LEGACY_BASE_URLS.includes(clean);
}
