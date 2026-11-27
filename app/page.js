import Link from "next/link";
import "./estudio.css";
import Logo from "@/components/Logo";
import { GpBy, GpFamily } from "@/components/GodsPlan";
import HeaderAuth from "@/components/landing/HeaderAuth";
import HeroPhone from "@/components/landing/HeroPhone";
import SetupSim from "@/components/landing/SetupSim";
import PhoneFrame from "@/components/landing/PhoneFrame";
import EstudioFx from "@/components/landing/EstudioFx";
import Microsite from "@/components/Microsite";
import { getDemo } from "@/lib/demoSites";
import SuggestButton from "@/components/SuggestButton";
import { CONTACT_EMAIL, whatsappLink } from "@/lib/contact";
import { AGENCY_URL } from "@/lib/site";

const STEPS = [
  {
    title: "Consigue tu GT",
    desc: "Cada GT trae un chip NFC ya registrado y un código de activación en su empaque.",
    chips: ["Chip NFC", "Código de activación"],
  },
  {
    title: "Vincúlalo a tu cuenta",
    desc: "Crea tu cuenta, escribe el ID y el código, y el GT queda a tu nombre.",
    chips: ["ID del GT", "Tu cuenta"],
  },
  {
    title: "Configúralo en un minuto",
    desc: "Elige el nombre, el estilo y los botones de tu negocio. Pruébalo aquí abajo.",
    chips: ["Nombre", "Estilo", "Botones"],
  },
  {
    title: "Tus clientes lo escanean",
    desc: "Acercan el celular al GT y ven tu página al instante. Sin descargar nada.",
    chips: ["Sin app", "Al instante"],
  },
];

const FEATURES = [
  {
    icon: "arrow",
    tag: "Modo directo",
    title: "Redirección directa",
    desc: "Lleva al cliente de inmediato a tu menú, tu WhatsApp, tu Instagram o tus reseñas de Google.",
    wide: true,
    hot: true,
  },
  {
    icon: "page",
    tag: "Micrositio",
    title: "Micrositio con tu estilo",
    desc: "Una página limpia con el nombre de tu negocio, tus colores y un botón destacado hacia lo que más te importa.",
  },
  {
    icon: "edit",
    tag: "Tu panel",
    title: "Cámbialo cuando quieras",
    desc: "El enlace del chip nunca cambia. Tú editas el destino desde tu panel y se actualiza al momento.",
  },
  {
    icon: "phone",
    tag: "NFC",
    title: "Sin app para tus clientes",
    desc: "La mayoría de los celulares modernos leen NFC directamente. Solo hay que acercarlos.",
    wide: true,
  },
];

const PLANS = [
  {
    name: "Básico",
    look: "basic",
    lookLabel: "Así se ve con Básico",
    price: "$350 MXN",
    note: "Pago único por tu GT · incluye 1 mes de Pro gratis",
    soon: false,
    featured: false,
    features: [
      "Tu GT con chip NFC listo para usar",
      "1 enlace directo (ej. tus reseñas de Google) o micrositio sencillo",
      "Horario con «Abierto» o «Cerrado» al momento",
      "Cambios ilimitados desde tu panel",
    ],
  },
  {
    name: "Pro",
    look: "pro",
    lookLabel: "Así puede verse con Pro",
    price: "$100 MXN al mes",
    note: "Tu primer mes va incluido al comprar tu GT",
    soon: false,
    featured: true,
    features: [
      "Varios botones: WhatsApp, reseñas, WiFi, pagos y más",
      "Menú, servicios o catálogo con precios",
      "Galería de fotos de tu trabajo",
      "Tu logo, tu portada y tus colores",
      "Estadísticas de escaneos y de clics por botón",
      "Sin la marca GodsTap",
    ],
  },
];

// El mismo negocio de ejemplo con cada plan, para comparar
const SAMPLE = getDemo("cafeteria");
const PLAN_LOOKS = {
  // Básico: nombre, frase, horario y un botón principal, con el diseño estándar
  basic: { name: SAMPLE.name, tagline: SAMPLE.tagline, mainUrl: SAMPLE.mainUrl, hours: SAMPLE.hours },
  // Pro: además logo, portada, colores, menú y todos los botones, sin la marca GodsTap
  pro: {
    name: SAMPLE.name,
    tagline: SAMPLE.tagline,
    mainUrl: SAMPLE.mainUrl,
    hours: SAMPLE.hours,
    links: SAMPLE.links,
    menu: SAMPLE.menu,
    theme: SAMPLE.theme,
    logo: SAMPLE.logo,
    cover: SAMPLE.cover,
    hideBrand: true,
  },
};

const FAQ = [
  {
    q: "¿Cuánto cuesta?",
    a: "El GT cuesta $350 MXN en un solo pago e incluye un mes de Pro gratis. Después puedes seguir con Pro por $100 MXN al mes o quedarte en Básico sin pagar nada más.",
  },
  {
    q: "¿Mis clientes necesitan instalar una app?",
    a: "No. Basta con acercar el celular al GT. La mayoría de los iPhone y Android recientes leen NFC sin instalar nada.",
  },
  {
    q: "¿Puedo cambiar el enlace después?",
    a: "Sí, las veces que quieras. El chip siempre abre la misma dirección y tú cambias el destino desde tu panel.",
  },
  {
    q: "¿Qué pasa si pierdo el código de activación?",
    a: "Escríbenos y lo revisamos contigo. Por seguridad, sin el código nadie más puede vincular tu GT.",
  },
  {
    q: "¿Necesito saber de tecnología?",
    a: "No. El asistente de configuración te pregunta tres cosas y listo.",
  },
];

// Cinta de lo que puede abrir un GT (decorativa)
const RIBBON = ["Menú", "WhatsApp", "Reseñas en Google", "Instagram", "WiFi para clientes", "Horario", "Catálogo", "Pagos", "Galería", "Ubicación", "Estadísticas", "Guardar contacto"];

// Íconos de trazo (1.6px, extremos redondeados), igual que godsplan.dev
const PATHS = {
  arrow: "M4 12h15M13 6l6 6-6 6",
  out: "M7 17 17 7M8 7h9v9",
  check: "m5 12.5 4.5 4.5L19 7.5",
  page: "M6 3.5h12v17H6zM9 8h6M9 12h6M9 16h4",
  edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  phone: "M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5zM11 18.5h2",
  nfc: "M8.5 8.5a5 5 0 0 1 0 7M11.5 6a8.5 8.5 0 0 1 0 12M14.5 3.5a12 12 0 0 1 0 17M5.5 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  star: "m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
  menu: "M6 3.5h12v17H6zM9 8h6M9 12h6M9 16h4",
  wifi: "M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01",
  mail: "M3 5h18v14H3zM4 7l8 6 8-6",
  chat: "M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
};

function Icon({ name, className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

// Glifo de WhatsApp: Font Awesome Free (CC BY 4.0)
function WaIcon({ className = "icon icon--fill" }) {
  return (
    <svg className={className} viewBox="0 0 448 512" aria-hidden="true">
      <path d="M380.9 97.1c-41.9-42-97.7-65.1-157-65.1-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1s56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8s-14.3 18-17.6 21.8c-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7s-12.5-30.1-17.1-41.2c-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4s4.6-24.1 3.2-26.4c-1.3-2.5-5-3.9-10.5-6.6z" />
    </svg>
  );
}

// Dibujos de línea de los pasos (un solo punto carmesí cada uno)
const STEP_ART = [
  <svg key="a" className="step__art" viewBox="0 0 96 96" aria-hidden="true"><rect x="22" y="26" width="52" height="44" rx="6" /><path className="soft" d="M22 40h52M40 26v14M56 26v14" /><circle className="pt" cx="76" cy="22" r="4" /></svg>,
  <svg key="b" className="step__art" viewBox="0 0 96 96" aria-hidden="true"><rect x="20" y="30" width="56" height="36" rx="6" /><path className="soft" d="M30 44h20M30 54h12" /><circle cx="62" cy="48" r="7" /><circle className="pt" cx="62" cy="48" r="3" /></svg>,
  <svg key="c" className="step__art" viewBox="0 0 96 96" aria-hidden="true"><rect x="32" y="14" width="32" height="68" rx="6" /><path className="soft" d="M40 30h16M40 40h16M40 50h10" /><circle className="pt" cx="48" cy="72" r="3.5" /></svg>,
  <svg key="d" className="step__art" viewBox="0 0 96 96" aria-hidden="true"><path d="M30 40a20 20 0 0 1 0 16M38 32a30 30 0 0 1 0 32M46 24a40 40 0 0 1 0 48" /><rect className="soft" x="58" y="26" width="22" height="44" rx="4" /><circle className="pt" cx="22" cy="48" r="4" /></svg>,
];

export default function HomePage() {
  return (
    <div className="estudio min-h-screen">
      <EstudioFx />
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-gp-crimson-700 focus:px-4 focus:py-2 focus:text-white">
        Saltar al contenido
      </a>

      {/* Encabezado: cápsula flotante */}
      <header className="hdr" id="header">
        <div className="hdr__pill">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" aria-label="GodsTap, inicio">
              <Logo />
            </Link>
            <GpBy className="hidden xl:inline-flex" />
          </div>
          <nav className="hdr__nav" aria-label="Principal">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#configurador">Pruébalo</a>
            <a href="#planes">Planes</a>
          </nav>
          <div className="hdr__end">
            <a className="hdr__wa" href={whatsappLink("Hola, quiero información de GodsTap")} target="_blank" rel="noopener noreferrer" aria-label="Escríbenos por WhatsApp">
              <WaIcon />
            </a>
            <HeaderAuth />
          </div>
        </div>
      </header>

      <main id="contenido">
        {/* 1. Portada */}
        <section className="hero" aria-labelledby="hero-t">
          <div className="hero__bands" aria-hidden="true" />
          <div className="hero__glow" aria-hidden="true" />
          <div className="wrap hero__grid">
            <div className="hero__copy">
              <p className="tag" data-enter style={{ "--d": 0 }}><span>Smart Tags NFC · GodsTap</span></p>
              <h1 className="hero__title" id="hero-t">
                <span className="wd" style={{ "--i": 0 }}>Acerca</span> <span className="wd" style={{ "--i": 1 }}>el</span>{" "}
                <span className="wd" style={{ "--i": 2 }}>celular.</span>
                <br /> <em className="wd" style={{ "--i": 3 }}>Aparece tu negocio.</em>
              </h1>
              <p className="hero__sub" data-enter style={{ "--d": 2 }}>
                El GT es un adhesivo con chip NFC que pegas en tu mostrador. Tus clientes lo tocan con el celular
                y ven tu menú, tu WhatsApp o tus reseñas. Tú cambias el destino desde tu panel cuando quieras.
              </p>
              <div className="actions" data-enter style={{ "--d": 3 }}>
                <Link href="/register" className="btn btn--primary">
                  Crear mi cuenta <Icon name="arrow" className="icon icon--move" />
                </Link>
                <a href="#configurador" className="btn btn--ghost">Pruébalo en 30 segundos</a>
              </div>
              <ul className="badges" aria-label="Ventajas" data-enter style={{ "--d": 4 }}>
                <li><span className="dot" aria-hidden="true" />Sin app para tus clientes</li>
                <li><span className="dot" aria-hidden="true" />Sin cambiar el chip nunca</li>
              </ul>
            </div>

            {/* El celular de ejemplo con anillos y ondas detrás */}
            <div className="stage">
              <div className="stage__fx" aria-hidden="true">
                <span className="orbit__ring orbit__ring--1" />
                <span className="orbit__ring orbit__ring--2" />
                <span className="orbit__ring orbit__ring--3" />
                <span className="orbit__wave" />
                <span className="orbit__wave orbit__wave--late" />
                <span className="float-chip float-chip--a"><span className="chip-f__ic"><Icon name="star" /></span>Reseñas</span>
                <span className="float-chip float-chip--b"><span className="chip-f__ic"><Icon name="menu" /></span>Menú</span>
                <span className="float-chip float-chip--c"><span className="chip-f__ic"><Icon name="wifi" /></span>WiFi</span>
                <span className="float-chip float-chip--d"><span className="chip-f__ic"><Icon name="chat" /></span>WhatsApp</span>
              </div>
              <HeroPhone />
            </div>
          </div>
        </section>

        {/* Cinta (decorativa) */}
        <div className="ribbon" aria-hidden="true">
          {[RIBBON, [...RIBBON.slice(6), ...RIBBON.slice(0, 6)]].map((row, r) => (
            <ul key={r} className={`ribbon__row${r ? " ribbon__row--rev" : ""}`}>
              {[...row, ...row].map((t, k) => (
                <li key={k} className="contents">
                  <span>{t}</span>
                  <span className="sep">✦</span>
                </li>
              ))}
            </ul>
          ))}
        </div>

        {/* 2. Cómo funciona */}
        <section className="method method--top" id="como-funciona" aria-labelledby="pasos-t">
          <div className="wrap">
            <div className="method__head">
              <div>
                <p className="tag" data-reveal><span>Cómo funciona</span></p>
                <h2 className="method__title" id="pasos-t" data-reveal>
                  De la caja a tu primer escaneo en <em>cuatro pasos.</em>
                </h2>
              </div>
              <p className="method__lede" data-reveal style={{ "--d": 1 }}>
                Sin técnicos ni instalaciones: lo vinculas tú desde el celular y queda listo para tus clientes.
              </p>
            </div>
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s.title} className="step" data-reveal style={{ "--d": i % 2 }}>
                  {STEP_ART[i]}
                  <div>
                    <h3><span className="mono">{String(i + 1).padStart(2, "0")}</span>{s.title}</h3>
                    <p>{s.desc}</p>
                    <ul className="chips">
                      {s.chips.map((c) => <li key={c}>{c}</li>)}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 3. Configurador de prueba */}
        <section id="configurador" className="sim" aria-labelledby="sim-t">
          <div className="wrap">
            <div className="sol__head">
              <div>
                <p className="tag" data-reveal><span>Pruébalo</span></p>
                <h2 className="sol__title" id="sim-t" data-reveal>
                  Tu página en <em>menos de un minuto.</em>
                </h2>
              </div>
              <p className="sol__lede" data-reveal style={{ "--d": 1 }}>
                Así de sencillo es configurar un GT. Elige, toca y mira cómo cambia el celular al instante.
              </p>
            </div>
            <div className="sim__panel" data-reveal>
              <SetupSim />
            </div>
          </div>
        </section>

        {/* 4. Qué puedes hacer */}
        <section className="sol" aria-labelledby="que-t">
          <div className="wrap">
            <div className="sol__head">
              <div>
                <p className="tag" data-reveal><span>Qué puedes hacer</span></p>
                <h2 className="sol__title" id="que-t" data-reveal>
                  Un solo chip. <em>El destino lo eliges tú.</em>
                </h2>
              </div>
              <p className="sol__lede" data-reveal style={{ "--d": 1 }}>
                Menú, WhatsApp, Instagram, reseñas de Google, tu sitio web. El enlace del GT nunca cambia; lo que ve tu cliente, sí.
              </p>
            </div>
            <ul className="bento bento--3">
              {FEATURES.map((f, i) => (
                <li key={f.title} className={`card${f.wide ? " card--wide" : ""}${f.hot ? " card--hot" : ""}`} data-reveal style={{ "--d": i % 3 }}>
                  <div className="card__link">
                    <span className="card__ic"><Icon name={f.icon} /></span>
                    <span className="card__tag mono">{f.tag}</span>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                    {f.hot && (
                      <span className="card__nfc" aria-hidden="true"><i /><i /><i /></span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. Planes (sección clara) */}
        <section id="planes" className="light" aria-labelledby="planes-t">
          <div className="wrap">
            <div className="light__head center">
              <p className="tag tag--dark" data-reveal><span>Planes</span></p>
              <h2 className="light__title" id="planes-t" data-reveal>
                Elige tu <em>plan.</em>
              </h2>
              <p className="light__sub" data-reveal style={{ "--d": 1 }}>
                Compras tu GT una sola vez y pruebas Pro un mes gratis. Aquí ves el mismo negocio con cada plan: desliza dentro de cada celular.
              </p>
            </div>
            <div className="plans">
              {PLANS.map((p, i) => (
                <article key={p.name} className={`plan${p.featured ? " plan--featured" : ""}`} data-reveal style={{ "--d": i }}>
                  <div className="plan__look">
                    <p className="plan__label mono">{p.lookLabel}</p>
                    <PhoneFrame className="h-[31rem] w-[16.5rem]">
                      <Microsite preview {...PLAN_LOOKS[p.look]} />
                    </PhoneFrame>
                  </div>
                  <div className="plan__body">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="plan__name">{p.name}</h3>
                      {p.featured && <span className="plan__flag mono">Recomendado</span>}
                      {p.soon && <span className="plan__flag mono">Próximamente</span>}
                    </div>
                    <p className="plan__price">{p.price}</p>
                    <p className="plan__note">{p.note}</p>
                    <ul className="plan__list">
                      {p.features.map((feat) => (
                        <li key={feat}>
                          <span className="pip"><Icon name="check" /></span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href={whatsappLink(p.soon ? `Hola, quiero que me avisen cuando esté listo el plan ${p.name} de GodsTap` : `Hola, quiero un GT de GodsTap (plan ${p.name})`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`btn ${p.featured ? "btn--light" : "btn--ghost"} plan__cta`}
                    >
                      <WaIcon className="icon icon--fill icon--wa" />
                      {p.soon ? "Avísame cuando esté listo" : "Pedirlo por WhatsApp"}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Preguntas frecuentes */}
        <section id="preguntas" className="faq" aria-labelledby="faq-t">
          <div className="wrap faq__grid">
            <div className="faq__head">
              <p className="tag" data-reveal><span>Preguntas</span></p>
              <h2 className="sol__title" id="faq-t" data-reveal>Preguntas <em>frecuentes</em></h2>
              <p className="sol__lede" data-reveal style={{ "--d": 1 }}>
                ¿Te quedó otra duda?{" "}
                <a className="faq__wa" href={whatsappLink("Hola, tengo una duda sobre GodsTap")} target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp</a>.
              </p>
            </div>
            <div className="faq__list">
              {FAQ.map((item, i) => (
                <details key={item.q} className="qa" data-reveal style={{ "--d": i % 3 }}>
                  <summary>
                    {item.q}
                    <span className="qa__plus" aria-hidden="true" />
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Cierre */}
        <section className="cta" aria-labelledby="cta-t">
          <div className="wrap">
            <div className="cta__panel" data-reveal>
              <div className="cta__glow" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/godstap-logo.jpg" alt="" width={900} height={900} loading="lazy" className="cta__logo" />
              <p className="tag"><span>Activa tu GT</span></p>
              <h2 className="cta__title" id="cta-t">¿Ya tienes tu GT?</h2>
              <p className="cta__sub">Crea tu cuenta y vincúlalo con el código de tu empaque.</p>
              <div className="actions actions--center">
                <Link href="/register" className="btn btn--light">Crear cuenta <Icon name="arrow" className="icon icon--move" /></Link>
                <Link href="/login" className="btn btn--ghost">Iniciar sesión</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Pie */}
      <footer className="ftr">
        <div className="wrap">
          <div className="ftr__row">
            <p className="text-sm">
              © 2026 GodsTap · by{" "}
              <a href={AGENCY_URL} target="_blank" rel="noopener noreferrer" className="text-gp-text-1 underline decoration-gp-crimson-400 underline-offset-4">
                God’s Plan
              </a>
            </p>
            <nav className="ftr__links" aria-label="Pie de página">
              <Link href="/privacidad">Aviso de privacidad</Link>
              <Link href="/terminos">Términos y condiciones</Link>
              <SuggestButton variant="plain" label="Sugerencias" context="Página principal" />
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </nav>
          </div>
          <p className="ftr__word" aria-hidden="true">GodsTap</p>
        </div>
      </footer>
      <GpFamily />
    </div>
  );
}
