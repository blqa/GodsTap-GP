"use client";

import { memo, useState } from "react";
import { MENU_LIMITS, countItems, parseMenuText } from "@/lib/menu";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

const small = "rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 disabled:opacity-30";

// Editor del menú de platillos. `menu` = { sections: [{ title, items: [{ name, price, desc }] }], note }
function MenuEditor({ menu, onChange }) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteMsg, setPasteMsg] = useState("");
  const [open, setOpen] = useState(null); // categoría abierta (solo una a la vez)

  const sections = menu.sections || [];
  const total = countItems(menu);
  const set = (next) => onChange({ ...menu, sections: next });

  const updateSection = (i, patch) => set(sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const updateItem = (i, j, patch) =>
    updateSection(i, { items: sections[i].items.map((it, k) => (k === j ? { ...it, ...patch } : it)) });
  const move = (arr, i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    const copy = [...arr];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  };

  const addSection = () => {
    if (sections.length >= MENU_LIMITS.sections) return;
    set([...sections, { title: "", items: [{ name: "", price: "", desc: "" }] }]);
    setOpen(sections.length);
  };

  const addItem = (i) => {
    if (total >= MENU_LIMITS.items) return;
    updateSection(i, { items: [...sections[i].items, { name: "", price: "", desc: "" }] });
  };

  const importText = () => {
    const parsed = parseMenuText(pasteText);
    if (!parsed.length) {
      setPasteMsg("No encontré platillos. Cada platillo va en su línea y termina con el precio.");
      return;
    }
    let room = MENU_LIMITS.items - total;
    const added = [];
    for (const s of parsed) {
      if (room <= 0 || sections.length + added.length >= MENU_LIMITS.sections) break;
      const items = s.items.slice(0, room);
      room -= items.length;
      added.push({ title: s.title.slice(0, MENU_LIMITS.title), items });
    }
    set([...sections, ...added]);
    setOpen(null);
    setPasteMsg(`Listo: se agregaron ${added.reduce((n, s) => n + s.items.length, 0)} platillos. Revísalos abajo.`);
    setPasteText("");
  };

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-50">Menú, servicios o catálogo</h3>
        <span className="text-xs text-slate-500">
          {total} de {MENU_LIMITS.items} platillos
        </span>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Tus clientes lo ven al tocar el botón, con las categorías arriba. Sirve para platillos, servicios con precio o productos. Déjalo vacío si no lo necesitas.
      </p>

      <div className="mb-3">
        <label className="mb-1.5 block text-sm font-medium text-slate-300">Texto del botón</label>
        <input
          value={menu.label || ""}
          onChange={(e) => onChange({ ...menu, label: e.target.value })}
          maxLength={MENU_LIMITS.label}
          placeholder="Ver menú"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500">Ej. «Ver menú», «Ver servicios», «Ver catálogo» o «Ver precios».</p>
      </div>

      <div className="mb-3">
        <button type="button" onClick={() => setPasteOpen(!pasteOpen)} className={small}>
          {pasteOpen ? "Cerrar" : "⚡ Pegar mi menú de golpe"}
        </button>
        {pasteOpen && (
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="mb-2 text-xs text-slate-400">
              Pega tu menú así: una línea con el nombre de la categoría y debajo sus platillos con el precio al final.
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={7}
              placeholder={"BEBIDAS\nCafé americano 35\nLatte - 55 - Con leche de avena\n\nPOSTRES\nPastel de zanahoria 60"}
              className={`${inputClass} font-mono`}
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button type="button" onClick={importText} className="rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-500">
                Agregar al menú
              </button>
              {pasteMsg && <span className="text-xs text-slate-400">{pasteMsg}</span>}
            </div>
          </div>
        )}
      </div>

      {sections.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-700 px-4 py-5 text-center text-sm text-slate-500">
          Aún no tienes platillos.
        </p>
      )}

      <div className="space-y-4">
        {sections.map((s, i) => {
          const isOpen = open === i;
          return (
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/60">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-100">{s.title || "Categoría sin nombre"}</span>
                <span className="block text-xs text-slate-500">
                  {s.items.length} {s.items.length === 1 ? "platillo" : "platillos"}
                </span>
              </span>
              <span className="text-xs text-slate-500">{isOpen ? "Cerrar" : "Editar"}</span>
            </button>
            {isOpen && (
            <div className="border-t border-slate-800 p-3">
            <div className="flex gap-2">
              <input
                value={s.title}
                onChange={(e) => updateSection(i, { title: e.target.value })}
                maxLength={MENU_LIMITS.title}
                placeholder="Categoría (ej. Bebidas)"
                className={`${inputClass} font-medium`}
              />
              <button type="button" onClick={() => { set(move(sections, i, -1)); setOpen(i - 1); }} disabled={i === 0} aria-label="Subir categoría" className={small}>↑</button>
              <button type="button" onClick={() => { set(move(sections, i, 1)); setOpen(i + 1); }} disabled={i === sections.length - 1} aria-label="Bajar categoría" className={small}>↓</button>
            </div>

            <div className="mt-3 space-y-3">
              {s.items.map((it, j) => (
                <div key={j} className="rounded-lg border border-slate-800 p-2.5">
                  <div className="grid gap-2 sm:grid-cols-[1fr_7rem]">
                    <input
                      value={it.name}
                      onChange={(e) => updateItem(i, j, { name: e.target.value })}
                      maxLength={MENU_LIMITS.name}
                      placeholder="Platillo"
                      className={inputClass}
                    />
                    <input
                      value={it.price}
                      onChange={(e) => updateItem(i, j, { price: e.target.value })}
                      maxLength={MENU_LIMITS.price}
                      inputMode="decimal"
                      placeholder="Precio"
                      className={inputClass}
                    />
                  </div>
                  <input
                    value={it.desc}
                    onChange={(e) => updateItem(i, j, { desc: e.target.value })}
                    maxLength={MENU_LIMITS.desc}
                    placeholder="Descripción (opcional)"
                    className={`${inputClass} mt-2`}
                  />
                  <div className="mt-2 flex gap-2 text-xs">
                    <button type="button" onClick={() => updateSection(i, { items: move(s.items, j, -1) })} disabled={j === 0} className={small}>↑ Subir</button>
                    <button type="button" onClick={() => updateSection(i, { items: move(s.items, j, 1) })} disabled={j === s.items.length - 1} className={small}>↓ Bajar</button>
                    <button
                      type="button"
                      onClick={() => updateSection(i, { items: s.items.filter((_, k) => k !== j) })}
                      className="ml-auto rounded-md px-2.5 py-1.5 text-red-400 hover:text-red-300"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => addItem(i)} disabled={total >= MENU_LIMITS.items} className={small}>
                + Platillo
              </button>
              <button
                type="button"
                onClick={() => {
                  if (s.items.length && !confirm("¿Quitar esta categoría con todos sus platillos?")) return;
                  set(sections.filter((_, k) => k !== i));
                  setOpen(null);
                }}
                className="ml-auto rounded-md px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300"
              >
                Quitar categoría
              </button>
            </div>
            </div>
            )}
          </div>
          );
        })}
      </div>

      <button type="button" onClick={addSection} disabled={sections.length >= MENU_LIMITS.sections} className={`${small} mt-3`}>
        + Categoría
      </button>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-300">Nota al final del menú (opcional)</label>
        <input
          value={menu.note || ""}
          onChange={(e) => onChange({ ...menu, note: e.target.value })}
          maxLength={MENU_LIMITS.note}
          placeholder="Ej. Precios en MXN. Pregunta por opciones sin gluten."
          className={inputClass}
        />
      </div>
    </div>
  );
}

export default memo(MenuEditor);
