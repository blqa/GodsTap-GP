export const ICONS = [
  { value: "link", label: "Enlace", emoji: "🔗" },
  { value: "whatsapp", label: "WhatsApp", emoji: "💬" },
  { value: "phone", label: "Llamar", emoji: "📞" },
  { value: "sms", label: "Mensaje SMS", emoji: "📱" },
  { value: "email", label: "Correo", emoji: "📧" },
  { value: "maps", label: "Ubicación", emoji: "📍" },
  { value: "pay", label: "Enlace de pago", emoji: "💳" },
  { value: "contact", label: "Guardar contacto", emoji: "👤" },
  { value: "wifi", label: "Red WiFi", emoji: "📶" },
  { value: "instagram", label: "Instagram", emoji: "📷" },
  { value: "facebook", label: "Facebook", emoji: "📘" },
  { value: "tiktok", label: "TikTok", emoji: "🎵" },
  { value: "menu", label: "Menú", emoji: "📋" },
  { value: "reviews", label: "Reseñas", emoji: "⭐" },
  { value: "web", label: "Sitio web", emoji: "🌐" },
];

export function getEmoji(value) {
  return ICONS.find((i) => i.value === value)?.emoji || "🔗";
}

// Qué tipo de dato pide cada botón: "url", "phone", "email", "contact" o "wifi"
export function kindOf(icon) {
  if (icon === "phone" || icon === "sms") return "phone";
  if (icon === "email") return "email";
  if (icon === "contact") return "contact";
  if (icon === "wifi") return "wifi";
  return "url";
}
