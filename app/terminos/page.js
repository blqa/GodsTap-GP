import LegalLayout from "@/components/LegalLayout";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata = {
  title: "Términos y condiciones · GodsTap · by God’s Plan",
};

const SECTIONS = [
  {
    title: "Qué es GodsTap",
    paragraphs: [
      "GodsTap es un servicio de God’s Plan que incluye el GT, un adhesivo con chip NFC, y un panel web donde el negocio decide a dónde lleva a sus clientes cuando acercan el celular.",
    ],
  },
  {
    title: "Tu cuenta",
    list: [
      "Debes dar datos reales y mantenerlos al día.",
      "Eres responsable de tu contraseña y de lo que se haga desde tu cuenta.",
      "Si sospechas que alguien más entró a tu cuenta, avísanos de inmediato.",
    ],
  },
  {
    title: "Vinculación de un GT",
    paragraphs: [
      "Cada GT trae un ID y un código de activación. Quien vincula el GT con ese código queda como su titular en la plataforma. Por eso debes cuidar el código de tu empaque.",
      "God’s Plan puede revocar un GT si detecta uso indebido, un error de vinculación o una solicitud del titular. Al revocarlo, el titular verá un aviso en su panel con el motivo y cómo contactarnos.",
    ],
  },
  {
    title: "Contenido y uso permitido",
    paragraphs: [
      "Tú eres responsable de los enlaces, textos y contenidos que configures. No puedes usar GodsTap para:",
    ],
    list: [
      "Engañar o suplantar a otras personas o negocios, ni robar datos o contraseñas.",
      "Llevar a sitios con virus o contenido ilegal.",
      "Publicar contenido que infrinja derechos de terceros.",
    ],
  },
  {
    title: "Planes y pagos",
    paragraphs: [
      "El plan Básico viene incluido con tu GT. El plan Pro es una suscripción. Los precios, las formas de pago y la activación se acuerdan directamente con God’s Plan, y el plan se activa desde la administración de GodsTap.",
      "Si un plan de pago no se renueva, tu GT puede regresar al plan Básico. Las condiciones de devolución del GT físico se acuerdan al momento de la compra.",
    ],
  },
  {
    title: "Disponibilidad del servicio",
    paragraphs: [
      "Hacemos lo posible por mantener el servicio funcionando, pero no podemos garantizar que esté disponible sin interrupciones. Que un celular lea el NFC también depende del modelo del teléfono y de que el NFC esté activado.",
    ],
  },
  {
    title: "Límites de responsabilidad",
    paragraphs: [
      "God’s Plan no es responsable de pérdidas indirectas, como ventas no realizadas o clientes que no pudieron escanear el GT. Nuestra responsabilidad total se limita a lo que hayas pagado por el servicio en los últimos 12 meses.",
    ],
  },
  {
    title: "Propiedad intelectual",
    paragraphs: [
      "La marca GodsTap, el sitio y el software son de God’s Plan. Tu contenido, como tu nombre, logo y enlaces, sigue siendo tuyo.",
    ],
  },
  {
    title: "Cancelación",
    paragraphs: [
      `Puedes dejar de usar GodsTap cuando quieras y pedir que eliminemos tu cuenta escribiendo a ${CONTACT_EMAIL}. Nosotros podemos suspender cuentas que incumplan estos términos.`,
    ],
  },
  {
    title: "Cambios y ley aplicable",
    paragraphs: [
      "Podemos actualizar estos términos y publicaremos la nueva versión en esta página. Si sigues usando GodsTap después del cambio, lo aceptas. Estos términos se rigen por las leyes aplicables de México.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Términos y condiciones"
      updated="7 de noviembre de 2026"
      intro="Al crear una cuenta o usar un GT aceptas estos términos. Están escritos para que se entiendan."
      sections={SECTIONS}
    />
  );
}
