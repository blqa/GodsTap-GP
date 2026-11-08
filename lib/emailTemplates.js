// Firmas y plantillas de correo de GodsTap · by God’s Plan (una sola voz en todo lo que sale de contacto@).
import { CONTACT_EMAIL, CONTACT_PHONE, SUPPORT_EMAIL } from "@/lib/contact";

const RED = "#8B0A14";
const INK = "#141011";
const SOFT = "#6D6164";

export const SENDER_NAME = "GodsTap · by God’s Plan";
export const FIREBASE_FROM = "noreply@godsplan.site";
export const SITE = "godstap.godsplan.site";

export const BRAND_COLORS = [
  { hex: "#8B0A14", label: "rojo marca" },
  { hex: "#141011", label: "negro" },
  { hex: "#FFFFFF", label: "fondo" },
  { hex: "#6D6164", label: "texto suave" },
];

export const FORMAT_RULES = [
  { title: "Asunto", text: "Acción clara + “· GodsTap”. Ej: Tu GT ya está activo · GodsTap" },
  { title: "Saludo", text: "“Hola, Nombre:” Cercano, de tú, sin “Estimado”." },
  { title: "Cuerpo", text: "Máximo 3 párrafos cortos. Una sola acción por correo." },
  { title: "Cierre", text: "“Quedo atento,” + firma. Nunca sin firma." },
  { title: "Remitente", text: `Nombre visible: ${SENDER_NAME}` },
  { title: "Respuestas", text: `Siempre llegan a ${CONTACT_EMAIL}` },
];

export function signature({ email, role, name, phone }) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:${INK};">
  <tr>
    <td style="border-left:3px solid ${RED};padding:2px 0 2px 14px;">
      <div style="font-size:15px;font-weight:bold;line-height:1.3;">${esc(name || "Tu nombre")}</div>
      <div style="font-size:12px;color:${SOFT};line-height:1.4;">${role}</div>
      <div style="font-size:14px;font-weight:bold;margin-top:10px;letter-spacing:0.3px;"><span style="color:${RED};">Gods</span>Tap <span style="font-size:11px;font-weight:normal;color:${SOFT};">· by God’s Plan</span></div>
      <div style="font-size:12px;color:${SOFT};line-height:1.6;margin-top:2px;">
        ${email} · WhatsApp ${esc(phone || "55 0000 0000")}<br>
        <a href="https://${SITE}" style="color:${RED};text-decoration:none;font-weight:bold;">${SITE}</a>
      </div>
    </td>
  </tr>
</table>`;
}

export const SIGNATURES = [
  { title: `Firma · ${SUPPORT_EMAIL} (ventas y producto)`, where: "Para ventas, clientes y temas del producto", email: SUPPORT_EMAIL, role: "Fundador · GodsTap" },
  { title: `Firma · ${CONTACT_EMAIL} (soporte general)`, where: "Para soporte y dudas generales", email: CONTACT_EMAIL, role: "Atención a clientes · God’s Plan" },
];

export const DEFAULT_PHONE = CONTACT_PHONE.replace(/^\+52\s*/, "");

export const REPLY_TEMPLATES = [
  {
    title: "Respuesta a un interesado",
    where: "Alguien pregunta por GodsTap",
    subject: "Así funciona tu GT · GodsTap",
    text: `Hola, [Nombre]:

Gracias por escribir. Un GT es una etiqueta que tus clientes acercan con el celular para abrir tu página: menú, redes, reseñas o lo que tú quieras, y la puedes cambiar cuando quieras desde tu cuenta.

Si te interesa, te llevo uno a tu negocio para que lo pruebes. ¿Qué día te queda bien esta semana?

Quedo atento,`,
  },
  {
    title: "Bienvenida tras la compra",
    where: "Ya compró su GT",
    subject: "Tu GT ya está listo · GodsTap",
    text: `Hola, [Nombre]:

Bienvenido a GodsTap. Para activar tu GT:

1. Entra a ${SITE} y crea tu cuenta.
2. Vincula tu GT con el código que viene en el empaque.
3. Edita tu página y guarda. Listo, ya funciona.

Si algo no sale, responde este correo y te ayudo.

Quedo atento,`,
  },
  {
    title: "Seguimiento",
    where: "No contestó en unos días",
    subject: "¿Lo probamos? · GodsTap",
    text: `Hola, [Nombre]:

Te escribo para dar seguimiento a lo del GT para tu negocio. Si quieres, te lo dejo unos días sin costo para que veas cuántos clientes lo usan.

¿Te parece si paso el [día]?

Quedo atento,`,
  },
];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function emailShell(heading, bodyHtml, cta, after) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f1f1;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden;">
      <tr><td style="background:${INK};padding:18px 28px;">
        <span style="font-size:18px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;"><span style="color:#e0303f;">Gods</span>Tap</span>
        <span style="font-size:11px;color:#b9aeb0;"> · by God’s Plan</span>
      </td></tr>
      <tr><td style="padding:28px 28px 8px;color:${INK};font-size:15px;line-height:1.6;">
        <h1 style="font-size:21px;margin:0 0 14px;color:${INK};">${heading}</h1>
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding:8px 28px 8px;">
        <a href="%LINK%" style="display:inline-block;background:${RED};color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 26px;border-radius:6px;">${cta}</a>
      </td></tr>
      <tr><td style="padding:16px 28px 26px;color:${SOFT};font-size:12px;line-height:1.6;">
        ${after}<br><br>
        Si el botón no funciona, copia este enlace en tu navegador:<br>
        <a href="%LINK%" style="color:${RED};word-break:break-all;">%LINK%</a>
      </td></tr>
      <tr><td style="border-top:1px solid #eee;padding:14px 28px;color:${SOFT};font-size:11px;">
        GodsTap · by God’s Plan · <a href="https://${SITE}" style="color:${SOFT};">${SITE}</a><br>
        ¿Dudas? Escríbenos a ${CONTACT_EMAIL}
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

export const FIREBASE_TEMPLATES = [
  {
    title: "Verificación de correo",
    where: "Email address verification",
    subject: "Confirma tu correo · GodsTap",
    html: emailShell(
      "Confirma tu correo",
      `<p style="margin:0 0 12px;">Hola, %DISPLAY_NAME%:</p>
<p style="margin:0 0 12px;">Ya casi está tu cuenta de GodsTap. Confirma que este correo es tuyo para poder vincular tu GT.</p>`,
      "Confirmar mi correo",
      "Si tú no creaste esta cuenta, ignora este mensaje."
    ),
  },
  {
    title: "Restablecer contraseña",
    where: "Password reset",
    subject: "Restablece tu contraseña · GodsTap",
    html: emailShell(
      "Restablece tu contraseña",
      `<p style="margin:0 0 12px;">Hola, %DISPLAY_NAME%:</p>
<p style="margin:0 0 12px;">Recibimos una solicitud para cambiar la contraseña de tu cuenta %EMAIL%. Elige una nueva con el botón.</p>`,
      "Crear nueva contraseña",
      "Si tú no lo pediste, ignora este correo: tu contraseña sigue igual."
    ),
  },
  {
    title: "Cambio de correo",
    where: "Email address change",
    subject: "Tu correo de GodsTap cambió",
    html: null,
  },
];

// Para la vista previa: reemplaza las variables de Firebase por datos de ejemplo
export function previewFirebase(html) {
  return html
    .replace(/%DISPLAY_NAME%/g, "Ana")
    .replace(/%EMAIL%/g, "ana@ejemplo.com")
    .replace(/href="%LINK%"/g, 'href="#"')
    .replace(/%LINK%/g, `https://${SITE}/__/auth/action?…`);
}
