// Datos de contacto de GodsTap · by God’s Plan. Cámbialos aquí y se actualizan en toda la web.
// contacto@: correo general (landing y páginas legales). godstap@: soporte del producto (avisos a clientes).
export const CONTACT_EMAIL = "contacto@godsplan.site";
export const SUPPORT_EMAIL = "godstap@godsplan.site";
export const CONTACT_PHONE = "+52 55 1059 0927";

const WA_NUMBER = CONTACT_PHONE.replace(/\D/g, "");

// Enlace que abre WhatsApp con un mensaje ya escrito
export function whatsappLink(text = "") {
  return `https://wa.me/${WA_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
