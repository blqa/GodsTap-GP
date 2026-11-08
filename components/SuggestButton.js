import { suggestionLink } from "@/lib/contact";

// Botón de sugerencias: abre el correo hacia godstap@ con el mensaje listo para escribir.
// variant: "pill" (botón con borde), "link" (texto de color) o "plain" (hereda el color, para pies de página).
export default function SuggestButton({ context, label = "Enviar una sugerencia", variant = "pill", className = "" }) {
  const look =
    variant === "plain"
      ? "transition hover:text-slate-300"
      : variant === "link"
      ? "text-brand-400 hover:text-brand-300 hover:underline"
      : "inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800";
  return (
    <a href={suggestionLink(context)} className={`${look} ${className}`}>
      {variant === "pill" && (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
        </svg>
      )}
      {label}
    </a>
  );
}
