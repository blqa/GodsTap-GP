import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { CONTACT_EMAIL } from "@/lib/contact";

// Marco para las páginas legales. sections: [{ title, paragraphs?: string[], list?: string[] }]
export default function LegalLayout({ title, updated, intro, sections }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/" aria-label="GodsTap · by God’s Plan, inicio">
            <Logo showBy />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-slate-500">Última actualización: {updated}</p>
        {intro && <p className="mt-8 leading-relaxed text-slate-300">{intro}</p>}

        {sections.map((s, i) => (
          <section key={s.title} className="mt-10">
            <h2 className="text-xl font-semibold text-slate-50">
              {i + 1}. {s.title}
            </h2>
            {s.paragraphs?.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-slate-300">
                {p}
              </p>
            ))}
            {s.list && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-slate-300 marker:text-brand-400">
                {s.list.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <p className="mt-14 border-t border-slate-800 pt-6 text-sm text-slate-500">
          ¿Dudas? Escríbenos a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-400 hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </main>

      <footer className="border-t border-slate-800/80 px-5 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <p>© 2026 GodsTap · by <a href="https://godsplan.site" target="_blank" rel="noopener noreferrer" className="transition hover:text-slate-300">God’s Plan</a></p>
          <nav className="flex gap-5">
            <Link href="/privacidad" className="hover:text-slate-300">Aviso de privacidad</Link>
            <Link href="/terminos" className="hover:text-slate-300">Términos y condiciones</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
