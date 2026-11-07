// Marca de GodsTap: un GT (disco rojo) con las ondas del NFC.

export function LogoMark({ className = "h-8 w-8", onRed = false }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="14" className={onRed ? "fill-brand-950/55" : "fill-brand-600"} />
      <circle cx="14" cy="14" r="13.25" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
      <circle cx="9.5" cy="14" r="1.9" fill="white" />
      <g stroke="white" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12.56 11.43A4 4 0 0 1 12.56 16.57" />
        <path d="M15.25 9.18A7.5 7.5 0 0 1 15.25 18.82" strokeOpacity="0.8" />
        <path d="M17.93 6.93A11 11 0 0 1 17.93 21.07" strokeOpacity="0.55" />
      </g>
    </svg>
  );
}

// showBy: añade "· by God’s Plan" junto al nombre (siempre visible en pantallas medianas en adelante)
// light: úsalo sobre un fondo rojo, para que el texto sea blanco en ambos temas
export default function Logo({ showBy = false, light = false, size = "md", className = "" }) {
  const mark = size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const text = size === "lg" ? "text-2xl" : "text-xl";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={mark} onRed={light} />
      <span className={`font-display ${text} font-bold leading-none tracking-tight ${light ? "text-white" : "text-slate-50"}`}>
        GodsTap
        {showBy && (
          <span className={`hidden font-sans text-sm font-normal tracking-normal sm:inline ${light ? "text-brand-100" : "text-slate-500"}`}>
            {" "}
            · by God’s Plan
          </span>
        )}
      </span>
    </span>
  );
}
