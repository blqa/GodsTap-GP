import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

// Marco compartido de inicio de sesión y registro.
// En pantallas grandes: panel rojo de marca a la izquierda y formulario a la derecha.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Panel de marca */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-800 to-brand-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <svg
          className="pointer-events-none absolute -bottom-40 -left-40 h-[44rem] w-[44rem] text-white"
          viewBox="0 0 400 400"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <circle cx="200" cy="200" r="50" strokeOpacity="0.2" strokeWidth="1.2" />
          <circle cx="200" cy="200" r="95" strokeOpacity="0.15" strokeWidth="1.2" />
          <circle cx="200" cy="200" r="140" strokeOpacity="0.1" strokeWidth="1.2" />
          <circle cx="200" cy="200" r="185" strokeOpacity="0.06" strokeWidth="1.2" />
        </svg>

        <Link href="/" className="relative w-fit" aria-label="Ir al inicio">
          <Logo light showBy />
        </Link>

        <div className="relative max-w-md">
          <p className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white xl:text-5xl">
            Un toque y tu negocio ya está en su celular.
          </p>
          <p className="mt-5 max-w-sm text-brand-100">
            Vincula tu GT, elige a dónde llevar a tus clientes y cámbialo cuando quieras.
          </p>
        </div>

        <p className="relative text-xs text-brand-200">© 2026 GodsTap · by God’s Plan</p>
      </aside>

      {/* Formulario */}
      <section className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible" aria-label="Ir al inicio">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
        </div>

        <p className="text-center text-xs text-slate-500 lg:hidden">© 2026 GodsTap · by God’s Plan</p>
      </section>
    </main>
  );
}
