"use client";

// Botón para cambiar entre modo oscuro y claro.
// El ícono correcto se elige con CSS (ver globals.css), así no hay desajustes al cargar.

export default function ThemeToggle({ className = "" }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";

    // Transición suave solo durante el cambio
    root.classList.add("theme-anim");
    root.dataset.theme = next;
    window.setTimeout(() => root.classList.remove("theme-anim"), 350);

    try {
      localStorage.setItem("gt-theme", next);
    } catch {
      // Si el navegador bloquea el almacenamiento, el tema solo dura esta visita.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar entre modo oscuro y claro"
      title="Cambiar tema"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-50 ${className}`}
    >
      {/* Sol: se muestra en modo oscuro */}
      <svg className="ti-sun h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      {/* Luna: se muestra en modo claro */}
      <svg className="ti-moon h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
