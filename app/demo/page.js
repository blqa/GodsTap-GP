import Link from "next/link";
import Logo from "@/components/Logo";
import { DEMOS } from "@/lib/demoSites";

export default function DemoIndex() {
  return (
    <main className="min-h-dvh bg-slate-950 px-5 py-10 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <Link href="/" aria-label="Ir al inicio">
          <Logo showBy />
        </Link>
        <h1 className="mt-10 text-3xl font-bold tracking-tight sm:text-4xl">Ejemplos de micrositios</h1>
        <p className="mt-3 max-w-xl text-slate-400">
          Así se ve lo que abre el celular de tu cliente al acercarlo al GT. Ábrelos desde tu teléfono para ver el
          resultado real.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {DEMOS.map((d) => (
            <Link
              key={d.slug}
              href={`/demo/${d.slug}`}
              className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition hover:border-slate-600"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.cover} alt="" width={1000} height={420} loading="lazy" className="aspect-[1000/420] w-full object-cover" />
              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-brand-400">{d.type}</p>
                <h2 className="mt-1 text-xl font-semibold">{d.name}</h2>
                <p className="mt-2 text-sm text-slate-400">{d.blurb}</p>
                <span className="mt-4 inline-block text-sm font-medium text-brand-400 group-hover:underline">Ver ejemplo →</span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-xs text-slate-500">
          Los negocios, teléfonos y cuentas de estos ejemplos son de mentira. El de FEHLMEX usa los datos públicos de
          fehlmex.com.
        </p>
      </div>
    </main>
  );
}
