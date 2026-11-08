"use client";

import { FONTS, FX_STYLES, PRESETS, SHAPES, fontStack, shapeRadius } from "@/lib/microsite";
import ImageField from "@/components/dashboard/ImageField";

function Section({ title, hint, children }) {
  return (
    <section className="border-t border-slate-800 pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
      {hint && <p className="mb-3 text-xs text-slate-500">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  );
}

function Choice({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-lg border px-3 py-1.5 text-xs transition ${
        selected ? "border-brand-500 bg-brand-600/15 text-slate-50" : "border-slate-700 text-slate-400 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

// Pestaña «Diseño»: plantillas, logo, portada, colores, letra, forma de botones y animación
export default function DesignEditor({ theme, setTheme, logo, setLogo, cover, setCover, lowContrast }) {
  const set = (patch) => setTheme({ ...theme, ...patch });

  return (
    <div className="space-y-6">
      <Section title="Plantillas" hint="Toca una para empezar. Después puedes cambiar lo que quieras abajo.">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
          {PRESETS.map((p) => {
            const font = p.font || "sans";
            const shape = p.shape || "round";
            const fx = p.fx || "particles";
            const selected =
              p.bg === theme.bg && p.accent === theme.accent && font === theme.font && shape === theme.shape && fx === theme.fx;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => set({ bg: p.bg, accent: p.accent, fx, font, shape })}
                aria-pressed={selected}
                className={`overflow-hidden rounded-xl border text-left transition ${
                  selected ? "border-brand-500 ring-2 ring-brand-500/40" : "border-slate-700 hover:border-slate-500"
                }`}
              >
                <span className="block px-2.5 py-3" style={{ backgroundColor: p.bg, fontFamily: fontStack(font) }}>
                  <span className="block text-sm font-semibold leading-none" style={{ color: p.accent }}>
                    Aa
                  </span>
                  <span
                    className="mt-2 block h-3 w-full"
                    style={{ backgroundColor: p.accent, borderRadius: Math.min(shapeRadius(shape), 8) }}
                  />
                  <span
                    className="mt-1 block h-3 w-3/4 opacity-30"
                    style={{ backgroundColor: p.accent, borderRadius: Math.min(shapeRadius(shape), 8) }}
                  />
                </span>
                <span className="block bg-slate-950 px-2 py-1.5 text-[11px] text-slate-300">{p.name}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Logo y portada" hint="Tu logo reemplaza la letra del círculo. La portada sale arriba de todo.">
        <div className="space-y-5">
          <ImageField
            kind="logo"
            label="Logo del negocio"
            hint="Cuadrado. Si tu imagen no lo es, acomódala en el recorte."
            value={logo}
            onChange={setLogo}
          />
          <ImageField
            kind="cover"
            label="Foto de portada"
            hint="Horizontal, como un banner. Se ve mejor una foto clara de tu local o tus productos."
            value={cover}
            onChange={setCover}
          />
        </div>
      </Section>

      <Section title="Colores">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="color"
              value={theme.bg}
              onChange={(e) => set({ bg: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded border border-slate-700 bg-transparent p-0.5"
            />
            Fondo
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="color"
              value={theme.accent}
              onChange={(e) => set({ accent: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded border border-slate-700 bg-transparent p-0.5"
            />
            Color de botones
          </label>
        </div>
        {lowContrast && (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            Los dos colores son muy parecidos y el botón principal casi no se va a notar. Prueba con colores más
            distintos.
          </p>
        )}
      </Section>

      <Section title="Tipo de letra">
        <div className="flex flex-wrap gap-2">
          {FONTS.map((f) => (
            <Choice key={f.value} selected={theme.font === f.value} onClick={() => set({ font: f.value })}>
              <span style={{ fontFamily: f.stack }} className="text-sm">
                {f.label}
              </span>
            </Choice>
          ))}
        </div>
      </Section>

      <Section title="Forma de los botones">
        <div className="flex flex-wrap gap-2">
          {SHAPES.map((sh) => (
            <Choice key={sh.value} selected={theme.shape === sh.value} onClick={() => set({ shape: sh.value })}>
              {sh.label}
            </Choice>
          ))}
        </div>
      </Section>

      <Section title="Animación de fondo">
        <div className="flex flex-wrap gap-2">
          {FX_STYLES.map((f) => (
            <Choice key={f.value} selected={theme.fx === f.value} onClick={() => set({ fx: f.value })}>
              {f.label}
            </Choice>
          ))}
        </div>
      </Section>
    </div>
  );
}
