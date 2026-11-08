// Marca de GodsTap: el GT con las ondas del NFC.

export function LogoMark({ className = "h-8 w-8" }) {
  // Imagen real del GT (con sus esquinas redondeadas). Se ve bien sobre fondos claros, oscuros y rojos.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/godstap-mark.png" alt="" width={128} height={128} className={`${className} shrink-0 object-contain`} aria-hidden="true" />
  );
}

// showBy: añade "· by God’s Plan" junto al nombre (siempre visible en pantallas medianas en adelante)
// light: úsalo sobre un fondo rojo, para que el texto sea blanco en ambos temas
export default function Logo({ showBy = false, light = false, size = "md", className = "" }) {
  const mark = size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const text = size === "lg" ? "text-2xl" : "text-xl";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={mark} />
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
