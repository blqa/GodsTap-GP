// Marca de GodsTap: el GT con las ondas del NFC.

// Por defecto: el GT con las ondas en PNG transparente, sobre cualquier fondo.
// onRed: sobre un fondo rojo se usa la versión plateada, para que no se pierda.
export function LogoMark({ className = "h-9", onRed = false }) {
  const sized = className.replace(/(^|\s)w-\S+/g, " ").trim();
  if (onRed) {
    // Versión plateada: resalta sobre fondos rojos
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/brand/godstap-gt-plata.png" alt="" width={480} height={259} className={`block ${sized} w-auto shrink-0 object-contain`} aria-hidden="true" />
    );
  }
  // PNG con fondo transparente: se ve bien igual en tema oscuro, claro y sobre fotos
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/godstap-gt.png" alt="" width={480} height={259} className={`block ${sized} w-auto shrink-0 object-contain`} aria-hidden="true" />
  );
}

// light: úsalo sobre un fondo rojo, para que el texto sea blanco en ambos temas
// El sello "by God’s Plan" ya no va aquí: se pone a un lado con <GpBy /> (components/GodsPlan.js),
// porque es un enlace y el logotipo suele estar dentro de otro enlace.
export default function Logo({ light = false, size = "md", className = "" }) {
  const mark = size === "lg" ? "h-12" : "h-9";
  const text = size === "lg" ? "text-2xl" : "text-xl";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={mark} onRed={light} />
      <span className={`font-display ${text} font-bold leading-none tracking-tight ${light ? "text-white" : "text-slate-50"}`}>
        GodsTap
      </span>
    </span>
  );
}
