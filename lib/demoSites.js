// Micrositios de ejemplo para enseñar GodsTap a clientes. Los negocios de ejemplo son inventados
// (teléfonos y cuentas son de mentira). FEHLMEX usa los datos públicos de su sitio fehlmex.com.

const SITE = "https://godstap.godsplan.site";

export const DEMOS = [
  {
    slug: "cafeteria",
    type: "Cafetería",
    blurb: "Menú con precios, WiFi para clientes y datos para pagar por transferencia.",
    name: "Café Luna",
    tagline: "Café de especialidad · Todos los días de 8:00 a 21:00",
    mainUrl: SITE,
    logo: "/demo/cafe-logo.png",
    cover: "/demo/cafe-cover.jpg",
    theme: { bg: "#231710", accent: "#d6a56b", font: "serif" },
    links: [
      { label: "Pedir por WhatsApp", icon: "whatsapp", url: "https://wa.me/525555010101" },
      { label: "Cómo llegar", icon: "maps", url: "https://www.google.com/maps/search/?api=1&query=Roma+Norte+CDMX" },
      { label: "Síguenos en Instagram", icon: "instagram", url: "https://instagram.com" },
      { label: "WiFi para clientes", icon: "wifi", url: "", data: { ssid: "CafeLuna_Clientes", password: "luna2026" } },
      {
        label: "Pagar por transferencia",
        icon: "pay",
        url: "",
        data: { mode: "bank", bank: "BBVA", holder: "Café Luna (ejemplo)", clabe: "012180000000000015", reference: "Pedido" },
      },
      { label: "Dejarnos una reseña", icon: "reviews", url: "https://www.google.com/maps" },
    ],
    menu: {
      label: "Ver menú",
      note: "Precios en MXN. Pregunta por opciones sin gluten.",
      sections: [
        {
          title: "Café caliente",
          items: [
            { name: "Espresso", price: "38", desc: "" },
            { name: "Americano", price: "42", desc: "" },
            { name: "Capuchino", price: "58", desc: "" },
            { name: "Latte", price: "62", desc: "Con leche entera o de avena" },
            { name: "Chai latte", price: "65", desc: "Té especiado con leche espumada" },
          ],
        },
        {
          title: "Bebidas frías",
          items: [
            { name: "Cold brew", price: "62", desc: "Infusión en frío de 18 horas" },
            { name: "Frappé de moka", price: "75", desc: "" },
            { name: "Limonada mineral", price: "45", desc: "" },
          ],
        },
        {
          title: "Panadería",
          items: [
            { name: "Croissant de mantequilla", price: "45", desc: "" },
            { name: "Pan de elote", price: "50", desc: "" },
            { name: "Rol de canela", price: "55", desc: "" },
          ],
        },
        {
          title: "Desayunos",
          items: [
            { name: "Chilaquiles", price: "95", desc: "Verdes o rojos, con huevo o pollo" },
            { name: "Sándwich de pavo", price: "98", desc: "Con aguacate y queso panela" },
            { name: "Hot cakes", price: "85", desc: "Con miel de maple y fruta" },
          ],
        },
      ],
    },
  },
  {
    slug: "barberia",
    type: "Barbería",
    blurb: "Lista de servicios con precios, botón para agendar por WhatsApp y ubicación.",
    name: "Don Rafa Barber Shop",
    tagline: "Corte clásico y barba · Lunes a sábado de 10:00 a 20:00",
    mainUrl: SITE,
    logo: "/demo/barberia-logo.png",
    cover: "/demo/barberia-cover.jpg",
    theme: { bg: "#121214", accent: "#d4af37", font: "serif", shape: "square", fx: "none" },
    links: [
      { label: "Agendar mi cita", icon: "whatsapp", url: "https://wa.me/525555010102" },
      { label: "Llamar a la barbería", icon: "phone", url: "tel:5555010102" },
      { label: "Cómo llegar", icon: "maps", url: "https://www.google.com/maps/search/?api=1&query=Coyoacan+CDMX" },
      { label: "Mira nuestros cortes", icon: "instagram", url: "https://instagram.com" },
      {
        label: "Pagar con transferencia",
        icon: "pay",
        url: "",
        data: { mode: "bank", bank: "BBVA", holder: "Rafael Mendoza (ejemplo)", clabe: "012180000000000015", reference: "Corte" },
      },
      { label: "Califícanos en Google", icon: "reviews", url: "https://www.google.com/maps" },
    ],
    menu: {
      label: "Ver servicios",
      note: "Con cita tienes prioridad. Aceptamos efectivo y transferencia.",
      sections: [
        {
          title: "Cortes",
          items: [
            { name: "Corte clásico", price: "180", desc: "Tijera o máquina, con acabado a navaja" },
            { name: "Fade", price: "200", desc: "Degradado a tu medida" },
            { name: "Corte + lavado", price: "220", desc: "" },
            { name: "Corte para niño", price: "140", desc: "Hasta 12 años" },
          ],
        },
        {
          title: "Barba",
          items: [
            { name: "Arreglo de barba", price: "120", desc: "Perfilado y recorte" },
            { name: "Afeitado con toalla caliente", price: "160", desc: "Navaja tradicional" },
          ],
        },
        {
          title: "Paquetes",
          items: [
            { name: "Corte + barba", price: "280", desc: "" },
            { name: "Paquete Don Rafa", price: "400", desc: "Corte, barba, mascarilla y bebida" },
          ],
        },
      ],
    },
  },
  {
    slug: "consultorio",
    type: "Consultorio dental",
    blurb: "Tema claro, botón de citas, tarjeta de contacto que se guarda en el celular y reseñas.",
    name: "Clínica Dental Sonrisa",
    tagline: "Odontología general y estética · Con cita previa",
    mainUrl: SITE,
    logo: "/demo/dental-logo.png",
    cover: "/demo/dental-cover.jpg",
    theme: { bg: "#f0fdfa", accent: "#0d9488", font: "rounded", shape: "pill", fx: "bubbles" },
    links: [
      { label: "Agendar mi cita", icon: "whatsapp", url: "https://wa.me/525555010103" },
      { label: "Llamar al consultorio", icon: "phone", url: "tel:5555010103" },
      { label: "Cómo llegar", icon: "maps", url: "https://www.google.com/maps/search/?api=1&query=Del+Valle+CDMX" },
      { label: "Guardar contacto", icon: "contact", url: "", data: { name: "Clínica Dental Sonrisa", phone: "5555010103", email: "citas@ejemplo.com" } },
      { label: "Escríbenos un correo", icon: "email", url: "mailto:citas@ejemplo.com" },
      { label: "Opiniones de pacientes", icon: "reviews", url: "https://www.google.com/maps" },
    ],
    menu: {
      label: "Ver tratamientos",
      note: "Los precios pueden variar según tu caso. La valoración es sin compromiso.",
      sections: [
        {
          title: "Consulta",
          items: [
            { name: "Valoración y diagnóstico", price: "Sin costo", desc: "Primera visita" },
            { name: "Consulta general", price: "350", desc: "" },
          ],
        },
        {
          title: "Tratamientos",
          items: [
            { name: "Limpieza dental", price: "600", desc: "Con revisión incluida" },
            { name: "Resina (restauración)", price: "700", desc: "Por pieza" },
            { name: "Blanqueamiento", price: "$2,800", desc: "Resultado en una sola cita" },
            { name: "Ortodoncia", price: "Desde $1,200", desc: "Mensualidad, según valoración" },
          ],
        },
      ],
    },
  },
  {
    slug: "fehlmex",
    type: "Empresa (para FEHLMEX)",
    blurb: "Versión corporativa con catálogo, llamada directa, ubicación y redes. Datos tomados de fehlmex.com.",
    name: "FEHLMEX",
    tagline: "Construyendo a otro nivel",
    mainUrl: "https://fehlmex.com/",
    logo: "/demo/fehlmex-logo.png",
    cover: "/demo/fehlmex-cover.jpg",
    theme: { bg: "#08192b", accent: "#4cc9f0", font: "sans" },
    links: [
      { label: "Llamar a ventas", icon: "phone", url: "tel:5551337200" },
      {
        label: "Cómo llegar",
        icon: "maps",
        url: "https://www.google.com/maps/search/?api=1&query=Avenida+Industria+244A+Moctezuma+2da+Seccion+15530+Ciudad+de+Mexico",
      },
      { label: "Síguenos en Instagram", icon: "instagram", url: "https://instagram.com/fehlmex_oficial" },
      { label: "Facebook", icon: "facebook", url: "https://facebook.com/fehlmex" },
      { label: "Guardar contacto", icon: "contact", url: "", data: { name: "FEHLMEX", phone: "5551337200" } },
    ],
    menu: {
      label: "Ver catálogo",
      note: "Solicita tu cotización por teléfono: 55 5133 7200.",
      sections: [
        {
          title: "Esterilización y control de infecciones",
          items: [
            { name: "Esterilizadores", price: "", desc: "" },
            { name: "Lavadoras", price: "", desc: "" },
          ],
        },
        {
          title: "Quirófano y mobiliario médico",
          items: [
            { name: "Mesas de cirugía", price: "", desc: "" },
            { name: "Lámparas", price: "", desc: "" },
            { name: "Mobiliario médico", price: "", desc: "" },
            { name: "Lavacómodos", price: "", desc: "" },
          ],
        },
        {
          title: "Laboratorio y equipo",
          items: [
            { name: "Refrigeradores", price: "", desc: "" },
            { name: "Instrumental médico", price: "", desc: "" },
            { name: "Equipo médico", price: "", desc: "" },
          ],
        },
      ],
    },
  },
];

export function getDemo(slug) {
  return DEMOS.find((d) => d.slug === slug) || null;
}
