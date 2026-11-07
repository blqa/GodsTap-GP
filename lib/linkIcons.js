export const ICONS = [
  { value: "link", label: "Enlace", emoji: "🔗" },
  { value: "whatsapp", label: "WhatsApp", emoji: "💬" },
  { value: "instagram", label: "Instagram", emoji: "📷" },
  { value: "facebook", label: "Facebook", emoji: "📘" },
  { value: "tiktok", label: "TikTok", emoji: "🎵" },
  { value: "menu", label: "Menú", emoji: "📋" },
  { value: "maps", label: "Ubicación", emoji: "📍" },
  { value: "reviews", label: "Reseñas", emoji: "⭐" },
  { value: "web", label: "Sitio web", emoji: "🌐" },
];

export function getEmoji(value) {
  return ICONS.find((i) => i.value === value)?.emoji || "🔗";
}