// Piezas de la familia God's Plan (DESIGN_SYSTEM.md §8 en blqa/godsplan-site).
// Los estilos .gp-by y .gp-family viven en app/globals.css.
import { AGENCY_URL, DOMAIN } from "@/lib/site";

const CROSS = "M28 10h8v16h16v8H36v22h-8V34H12v-8h16z";

function Cross({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path d={CROSS} />
    </svg>
  );
}

// Sello "by God's Plan" junto al logotipo del encabezado.
// onRed: sobre el panel rojo de inicio de sesión.
export function GpBy({ onRed = false, className = "" }) {
  return (
    <a
      className={`gp-by ${onRed ? "gp-by--on-red" : ""} ${className}`.trim()}
      href={AGENCY_URL}
      target="_blank"
      rel="noopener"
    >
      <Cross className="gp-by__mark" />
      by God’s Plan
    </a>
  );
}

// Franja final del pie: une GodsTap con godsplan.dev y rig.godsplan.dev.
export function GpFamily() {
  return (
    <div className="gp-family">
      <div className="gp-family__inner">
        <a className="gp-family__home" href={AGENCY_URL}>
          <Cross className="gp-by__mark" />
          <span>
            Un proyecto de <strong>God’s Plan</strong>
          </span>
        </a>
        <nav className="gp-family__links" aria-label="Proyectos de God’s Plan">
          <a href={AGENCY_URL}>{DOMAIN}</a>
          <a href={`https://godstap.${DOMAIN}`} aria-current="page">
            godstap
          </a>
          <a href={`https://rig.${DOMAIN}`}>rig</a>
        </nav>
      </div>
    </div>
  );
}
