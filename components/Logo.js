// Marca de GodsTap: el GT con las ondas del NFC.

// Por defecto: el GT con las ondas en PNG transparente, sobre cualquier fondo.
// onRed: sobre un fondo rojo se usa la versión en cuadrito oscuro, para que no se pierda.
export function LogoMark({ className = "h-9", onRed = false }) {
  const sized = className.replace(/(^|\s)w-\S+/g, " ").trim();
  if (onRed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/brand/godstap-mark.png" alt="" width={128} height={128} className={`block ${sized} aspect-square w-auto shrink-0 object-contain`} aria-hidden="true" />
    );
  }
  // PNG con fondo transparente: se ve bien igual en tema oscuro, claro y sobre fotos
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/godstap-gt.png" alt="" width={480} height={259} className={`block ${sized} w-auto shrink-0 object-contain`} aria-hidden="true" />
  );
}

// showBy: añade "· by God’s Plan" junto al nombre (siempre visible en pantallas medianas en adelante)
// light: úsalo sobre un fondo rojo, para que el texto sea blanco en ambos temas
export default function Logo({ showBy = false, light = false, size = "md", className = "" }) {
  const mark = size === "lg" ? "h-12" : "h-9";
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
