import LegalLayout from "@/components/LegalLayout";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/contact";

export const metadata = {
  title: "Aviso de privacidad · GodsTap · by God’s Plan",
};

const SECTIONS = [
  {
    title: "Quién es el responsable",
    paragraphs: [
      `God’s Plan es el responsable de tus datos personales en GodsTap. Puedes contactarnos en ${CONTACT_EMAIL} o por WhatsApp al ${CONTACT_PHONE}.`,
    ],
  },
  {
    title: "Qué datos recopilamos",
    list: [
      "Datos de tu cuenta: nombre, nombre de tu negocio y correo electrónico.",
      "Tu contraseña. La guarda Firebase Authentication de forma cifrada; nosotros no podemos verla.",
      "La configuración de tus GT: alias, nombre del negocio, enlaces, botones y colores.",
      "Estadísticas de escaneo (planes de pago): cuántas veces se abrió cada GT por día. No identifican a quien escanea.",
    ],
  },
  {
    title: "Para qué usamos tus datos",
    list: [
      "Crear y administrar tu cuenta y vincular tus GT.",
      "Mostrar la página o el enlace que configuraste cuando alguien escanea tu GT.",
      "Darte soporte y avisarte de cambios importantes, como la revocación de un GT.",
      "Activar y administrar tu plan.",
    ],
  },
  {
    title: "Las personas que escanean tu GT",
    paragraphs: [
      "A quienes escanean un GT no les pedimos datos, cuenta ni registro. Solo sumamos un escaneo al conteo del día. El servicio de hospedaje puede registrar datos técnicos básicos, como la dirección IP, de forma temporal y por seguridad.",
    ],
  },
  {
    title: "Con quién compartimos la información",
    paragraphs: [
      "No vendemos tus datos. Usamos proveedores que los procesan para que el servicio funcione:",
    ],
    list: [
      "Google Firebase: inicio de sesión y base de datos.",
      "Vercel: hospedaje del sitio.",
    ],
  },
  {
    title: "Tus derechos",
    paragraphs: [
      `Tienes derecho a acceder a tus datos, corregirlos, cancelarlos y oponerte a su uso (derechos ARCO). También puedes pedir que eliminemos tu cuenta. Escríbenos a ${CONTACT_EMAIL} desde el correo con el que te registraste y te respondemos en los plazos que marca la ley.`,
    ],
  },
  {
    title: "Cuánto tiempo guardamos tus datos",
    paragraphs: [
      "Mientras tu cuenta esté activa. Si pides eliminarla, borramos tus datos, salvo lo que la ley nos obligue a conservar.",
    ],
  },
  {
    title: "Cambios a este aviso",
    paragraphs: [
      "Si cambiamos este aviso, publicaremos la nueva versión en esta página con su fecha de actualización.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Aviso de privacidad"
      updated="7 de noviembre de 2026"
      intro="En GodsTap · by God’s Plan cuidamos tus datos. Este aviso explica qué información guardamos, para qué la usamos y cómo puedes controlarla."
      sections={SECTIONS}
    />
  );
}
