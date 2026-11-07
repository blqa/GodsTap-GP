import Link from "next/link";

const CONTACT_EMAIL = "godstap@godsplan.com"; // <-- CAMBIA ESTO

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
    desc: "Elige el nombre de tu negocio y a dónde quieres llevar a tus clientes.",
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
    title: "Micrositio",
    desc: "Una página limpia con el nombre de tu negocio y un botón destacado hacia lo que más te importa.",
  },
  {
    title: "Cámbialo cuando quieras",
    desc: "El enlace del chip nunca cambia. Tú editas el destino desde tu panel y se actualiza al momento.",
  },
  {
    title: "Sin app para tus clientes",
    desc: "La mayoría de los celulares modernos leen NFC directamente, solo hay que acercarlos.",
  },
];

const PLANS = [
  {
    name: "Básico",
    price: "Consulta precio",
    note: "Incluido con tu GT",
    soon: false,
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
    soon: true,
    features: [
      "Micrositio con varios botones",
      "Logo y colores de tu marca",
      "Estadísticas de escaneos",
      "Sin la marca GodsTap",
    ],
  },
  {
    name: "Negocio",
    price: "Consulta precio",
    note: "Para varias sucursales",
    soon: true,
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

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-900/40">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      </div>
      <span className="text-lg font-semibold tracking-tight text-white">GodsTap</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-3">
            <a href="#planes" className="hidden px-3 py-2 text-sm text-slate-300 transition hover:text-white sm:block">
              Planes
            </a>
            <Link href="/login" className="px-3 py-2 text-sm font-medium text-slate-200 transition hover:text-white">
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-24 pt-20 text-center sm:pt-28">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700">
            Smart Tags NFC para negocios locales
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Un toque y tu negocio{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              aparece en su celular
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-slate-400 sm:text-lg">
            Pon un GT en tu mostrador y deja que tus clientes vean tu menú, te escriban por WhatsApp o
            te dejen una reseña con solo acercar su teléfono. Tú cambias el destino cuando quieras.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-violet-500 sm:w-auto"
            >
              Crear mi cuenta
            </Link>
            <a
              href="#como-funciona"
              className="w-full rounded-xl border border-slate-700 px-7 py-3.5 text-sm font-medium text-slate-200 transition hover:bg-slate-900 sm:w-auto"
            >
              Ver cómo funciona
            </a>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white">Cómo funciona</h2>
          <p className="mt-3 text-slate-400">De la caja a tu primer escaneo en cuatro pasos.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Qué puedes hacer */}
      <section className="border-y border-slate-800/80 bg-slate-900/30 px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white">Qué puedes hacer con tu GT</h2>
            <p className="mt-3 text-slate-400">Menú, WhatsApp, Instagram, reseñas de Google, tu sitio web...</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                <h3 className="text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white">Planes</h2>
          <p className="mt-3 text-slate-400">Empieza con el básico y crece cuando tu negocio lo pida.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-2xl border p-6 ${
                p.soon ? "border-slate-800 bg-slate-900/40" : "border-indigo-500/40 bg-slate-900/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                {p.soon && (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
                    Próximamente
                  </span>
                )}
              </div>
              <p className="mt-4 text-2xl font-semibold text-white">{p.price}</p>
              <p className="mt-1 text-sm text-slate-500">{p.note}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
                {p.features.map((feat) => (
                  <li key={feat} className="flex gap-2">
                    <span className="text-indigo-400">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Información plan " + p.name)}`}
                className={`mt-8 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                  p.soon
                    ? "border border-slate-700 text-slate-200 hover:bg-slate-800"
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                {p.soon ? "Avísame cuando esté listo" : "Pedir información"}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="mx-auto max-w-3xl px-5 pb-20">
        <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight text-white">
          Preguntas frecuentes
        </h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-white">
                {item.q}
                <span className="ml-4 text-slate-500 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-slate-400">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-5 pb-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-violet-600/10 p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            ¿Ya tienes tu GT?
          </h2>
          <p className="mt-3 text-slate-400">Crea tu cuenta y vincúlalo con el código de tu empaque.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="w-full rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 sm:w-auto"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-slate-700 px-7 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-900 sm:w-auto"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <p>© 2026 GodsTap · by God’s Plan</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="transition hover:text-slate-300">
            {CONTACT_EMAIL}
          </a>
        </div>
      </footer>
    </div>
  );
}