import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import HeaderAuth from "@/components/landing/HeaderAuth";
import HeroPhone from "@/components/landing/HeroPhone";
import SetupSim from "@/components/landing/SetupSim";
import SuggestButton from "@/components/SuggestButton";
import { CONTACT_EMAIL, whatsappLink } from "@/lib/contact";

const STEPS = [
  {
    title: "Consigue tu GT",
    desc: "Cada GT trae un chip NFC ya registrado y un código de activación en su empaque.",
  },
  {
    title: "Vincúlalo a tu cuenta",
    desc: "Crea tu cuenta, escribe el ID y el código, y el GT queda a tu nombre.",
  },
  {
    title: "Configúralo en un minuto",
    desc: "Elige el nombre, el estilo y los botones de tu negocio. Pruébalo aquí abajo.",
  },
  {
    title: "Tus clientes lo escanean",
    desc: "Acercan el celular al GT y ven tu página al instante. Sin descargar nada.",
  },
];

const FEATURES = [
  {
    title: "Redirección directa",
    desc: "Lleva al cliente de inmediato a tu menú, tu WhatsApp, tu Instagram o tus reseñas de Google.",
  },
  {
    title: "Micrositio con tu estilo",
    desc: "Una página limpia con el nombre de tu negocio, tus colores y un botón destacado hacia lo que más te importa.",
  },
  {
    title: "Cámbialo cuando quieras",
    desc: "El enlace del chip nunca cambia. Tú editas el destino desde tu panel y se actualiza al momento.",
  },
  {
    title: "Sin app para tus clientes",
    desc: "La mayoría de los celulares modernos leen NFC directamente. Solo hay que acercarlos.",
  },
];

const PLANS = [
  {
    name: "Básico",
    price: "Consulta precio",
    note: "Incluido con tu GT",
    soon: false,
    featured: false,
    features: [
      "1 enlace de redirección o micrositio simple",
      "Cambios ilimitados desde tu panel",
      "Asistente de configuración rápida",
    ],
  },
  {
    name: "Pro",
    price: "Consulta precio",
    note: "Suscripción",
    soon: false,
    featured: true,
    features: [
      "Micrositio con varios botones",
      "Colores personalizados",
      "Estadísticas de escaneos",
      "Sin la marca GodsTap",
    ],
  },
  {
    name: "Negocio",
    price: "Consulta precio",
    note: "Para varias sucursales",
    soon: true,
    featured: false,
    features: [
      "Varios GT y sucursales",
      "Usuarios de equipo",
      "Dominio propio",
      "Atención prioritaria",
    ],
  },
];

const FAQ = [
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="GodsTap · by God’s Plan, inicio">
            <Logo showBy />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#como-funciona" className="hidden px-3 py-2 text-sm text-slate-300 transition hover:text-slate-50 md:block">
              Cómo funciona
            </a>
            <a href="#configurador" className="hidden px-3 py-2 text-sm text-slate-300 transition hover:text-slate-50 md:block">
              Pruébalo
            </a>
            <a href="#planes" className="hidden px-3 py-2 text-sm text-slate-300 transition hover:text-slate-50 sm:block">
              Planes
            </a>
            <HeaderAuth />
            <ThemeToggle className="ml-1" />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 top-0 h-[34rem] w-[34rem] rounded-full bg-brand-600/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="text-5xl font-bold leading-[0.98] tracking-tight text-slate-50 sm:text-7xl">
              Acerca el celular.
              <br />
              Aparece tu negocio.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
              El GT es un adhesivo con chip NFC que pegas en tu mostrador. Tus clientes lo tocan con el celular
              y ven tu menú, tu WhatsApp o tus reseñas. Tú cambias el destino desde tu panel cuando quieras.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="rounded-xl bg-brand-600 px-7 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-500"
              >
                Crear mi cuenta
              </Link>
              <a
                href="#configurador"
                className="rounded-xl border border-slate-700 px-7 py-3.5 text-center text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
              >
                Pruébalo en 30 segundos
              </a>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Sin app para tus clientes. Sin cambiar el chip nunca.
            </p>
          </div>

          <HeroPhone />
        </div>
      </section>

      {/* Cómo funciona: una secuencia, por eso va numerada */}
      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <div className="mb-14 max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
            De la caja a tu primer escaneo en cuatro pasos
          </h2>
        </div>
        <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative border-t border-slate-700 pt-8">
              <span className="absolute -top-4 left-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 font-display text-sm font-bold text-white ring-4 ring-slate-950">
                {i + 1}
              </span>
              <h3 className="text-lg font-semibold text-slate-50">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Configurador de prueba */}
      <section id="configurador" className="scroll-mt-20 border-y border-slate-800/80 bg-slate-900/40 px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">Pruébalo: tu página en menos de un minuto</h2>
            <p className="mt-3 text-slate-400">
              Así de sencillo es configurar un GT. Elige, toca y mira cómo cambia el celular al instante.
            </p>
          </div>
          <SetupSim />
        </div>
      </section>

      {/* Qué puedes hacer */}
      <section className="border-y border-slate-800/80 bg-slate-900/40 px-5 py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
              Un solo chip. El destino lo eliges tú.
            </h2>
            <p className="mt-4 max-w-sm text-slate-400">
              Menú, WhatsApp, Instagram, reseñas de Google, tu sitio web. El enlace del GT nunca cambia; lo que ve tu cliente, sí.
            </p>
          </div>
          <dl className="lg:col-span-7">
            {FEATURES.map((f) => (
              <div key={f.title} className="grid gap-1 border-t border-slate-700 py-6 sm:grid-cols-[14rem_1fr] sm:gap-8">
                <dt className="font-display text-xl font-semibold text-slate-50">{f.title}</dt>
                <dd className="text-sm leading-relaxed text-slate-400">{f.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
        <div className="mb-12 max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">Planes</h2>
          <p className="mt-3 text-slate-400">Empieza con el básico y crece cuando tu negocio lo pida.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-2xl p-7 ${
                p.featured
                  ? "bg-brand-600 text-white shadow-2xl shadow-brand-900/40"
                  : "border border-slate-700 bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${p.featured ? "text-white" : "text-slate-50"}`}>{p.name}</h3>
                {p.soon && (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
                    Próximamente
                  </span>
                )}
              </div>
              <p className={`mt-5 font-display text-2xl font-bold ${p.featured ? "text-white" : "text-slate-50"}`}>
                {p.price}
              </p>
              <p className={`mt-1 text-sm ${p.featured ? "text-brand-100" : "text-slate-500"}`}>{p.note}</p>
              <ul className={`mt-7 flex-1 space-y-3 text-sm ${p.featured ? "text-brand-50" : "text-slate-300"}`}>
                {p.features.map((feat) => (
                  <li key={feat} className="flex gap-2.5">
                    <svg
                      className={`mt-0.5 h-4 w-4 shrink-0 ${p.featured ? "text-white" : "text-brand-400"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <a
                href={whatsappLink(p.soon ? `Hola, quiero que me avisen cuando esté listo el plan ${p.name} de GodsTap` : `Hola, quiero información del plan ${p.name} de GodsTap`)}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-9 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                  p.featured
                    ? "bg-white text-brand-700 hover:bg-brand-50"
                    : "border border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                {p.soon ? "Avísame cuando esté listo" : "Pedir información"}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="mx-auto max-w-3xl px-5 pb-24">
        <h2 className="mb-8 text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">Preguntas frecuentes</h2>
        <div className="border-b border-slate-700">
          {FAQ.map((item) => (
            <details key={item.q} className="group border-t border-slate-700 py-5">
              <summary className="flex list-none items-center justify-between gap-4 text-base font-medium text-slate-50">
                {item.q}
                <span className="text-xl leading-none text-brand-400 transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Cierre */}
      <section className="px-5 pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 px-8 py-14 sm:px-14 sm:py-16">
          <svg
            className="pointer-events-none absolute -right-24 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 text-white"
            viewBox="0 0 400 400"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <circle cx="200" cy="200" r="60" strokeOpacity="0.22" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="110" strokeOpacity="0.16" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="160" strokeOpacity="0.1" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="198" strokeOpacity="0.06" strokeWidth="1.5" />
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/godstap-logo.jpg"
            alt="Logo de GodsTap"
            width={900}
            height={900}
            loading="lazy"
            className="absolute right-10 top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-3xl object-cover shadow-2xl shadow-black/40 ring-1 ring-white/20 lg:block"
          />
          <div className="relative max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">¿Ya tienes tu GT?</h2>
            <p className="mt-4 text-brand-100">Crea tu cuenta y vincúlalo con el código de tu empaque.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="rounded-xl bg-white px-7 py-3 text-center text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/40 px-7 py-3 text-center text-sm font-medium text-white transition hover:bg-white/10"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pie */}
      <footer className="border-t border-slate-800/80 px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-slate-500 sm:flex-row">
          <p>© 2026 GodsTap · by God’s Plan</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacidad" className="transition hover:text-slate-300">
              Aviso de privacidad
            </Link>
            <Link href="/terminos" className="transition hover:text-slate-300">
              Términos y condiciones
            </Link>
            <SuggestButton variant="plain" label="Sugerencias" context="Página principal" />
            <a href={`mailto:${CONTACT_EMAIL}`} className="transition hover:text-slate-300">
              {CONTACT_EMAIL}
            </a>
          </nav>
        </div>
      </footer>

      {/* Botón flotante de WhatsApp */}
      <a
        href={whatsappLink("Hola, quiero información de GodsTap")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/30 transition hover:scale-105"
      >
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7.5 19.5 3 21l1.5-4.3A8.5 8.5 0 1 1 7.5 19.5z" />
          <path d="M9 9.5c.3 2 1.8 3.7 3.8 4.5l1.2-1.2 1.8.9c-.3 1-1.2 1.6-2.2 1.5C10.7 14.9 8.6 12.5 8.5 10c0-.9.6-1.7 1.5-1.8z" fill="currentColor" stroke="none" />
        </svg>
      </a>
    </div>
  );
}
