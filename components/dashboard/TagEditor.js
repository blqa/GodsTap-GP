"use client";

import { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { ICONS } from "@/lib/linkIcons";

const MAX_LINKS = 6;

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30";

function isValidUrl(url) {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

export default function TagEditor({ tag, onClose, onSaved }) {
  const [name, setName] = useState(tag.business_name || "");
  const [mode, setMode] = useState(tag.mode === "redirect" ? "redirect" : "microsite");
  const [url, setUrl] = useState(tag.target_url || "");
  const [links, setLinks] = useState(
    Array.isArray(tag.links)
      ? tag.links.map((l) => ({
          label: l?.label || "",
          url: l?.url || "",
          icon: l?.icon || "link",
        }))
      : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateLink = (i, patch) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const removeLink = (i) => setLinks(links.filter((_, idx) => idx !== i));

  const moveLink = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const copy = [...links];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setLinks(copy);
  };

  const addLink = () => {
    if (links.length >= MAX_LINKS) return;
    setLinks([...links, { label: "", url: "", icon: "link" }]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanUrl = url.trim();

    if (!cleanName || cleanName.length > 80) {
      setError("El nombre es obligatorio (máximo 80 caracteres).");
      return;
    }
    if (!isValidUrl(cleanUrl)) {
      setError("El enlace principal debe empezar con http:// o https://");
      return;
    }

    const cleanLinks = [];
    for (let i = 0; i < links.length; i++) {
      const label = links[i].label.trim();
      const link = links[i].url.trim();
      if (!label && !link) continue; // fila vacía: se ignora
      if (!label || label.length > 30) {
        setError(`Botón ${i + 1}: escribe un texto (máximo 30 caracteres).`);
        return;
      }
      if (!isValidUrl(link)) {
        setError(`Botón ${i + 1}: el enlace debe empezar con http:// o https://`);
        return;
      }
      cleanLinks.push({ label, url: link, icon: links[i].icon });
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "tags", tag.id), {
        business_name: cleanName,
        mode,
        target_url: cleanUrl,
        links: cleanLinks,
        updated_at: serverTimestamp(),
      });
      await onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar. Inténtalo de nuevo.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <form
        onSubmit={handleSave}
        className="my-6 w-full max-w-xl space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">
            Editar GT <span className="font-mono text-sm text-slate-400">{tag.id}</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-500 hover:text-white">
            ✕
          </button>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre del negocio</label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Modo</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
              <option value="microsite">Micrositio</option>
              <option value="redirect">Redirección directa</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              {mode === "microsite" ? "Enlace principal (botón destacado)" : "Enlace de destino"}
            </label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
        </div>

        {mode === "microsite" ? (
          <div className="border-t border-slate-800 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Botones adicionales</h3>
                <p className="text-xs text-slate-500">
                  {links.length} de {MAX_LINKS}. Salen debajo del botón principal.
                </p>
              </div>
              <button
                type="button"
                onClick={addLink}
                disabled={links.length >= MAX_LINKS}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Agregar
              </button>
            </div>

            {links.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-700 px-4 py-5 text-center text-sm text-slate-500">
                Aún no tienes botones adicionales.
              </p>
            )}

            <div className="space-y-3">
              {links.map((l, i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="grid gap-2 sm:grid-cols-[9rem_1fr]">
                    <select value={l.icon} onChange={(e) => updateLink(i, { icon: e.target.value })} className={inputClass}>
                      {ICONS.map((ic) => (
                        <option key={ic.value} value={ic.value}>
                          {ic.emoji} {ic.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={l.label}
                      onChange={(e) => updateLink(i, { label: e.target.value })}
                      maxLength={30}
                      placeholder="Texto del botón (ej. Escríbenos)"
                      className={inputClass}
                    />
                  </div>
                  <input
                    value={l.url}
                    onChange={(e) => updateLink(i, { url: e.target.value })}
                    placeholder="https://..."
                    className={`${inputClass} mt-2`}
                  />
                  <div className="mt-2 flex gap-4 text-xs text-slate-400">
                    <button type="button" onClick={() => moveLink(i, -1)} disabled={i === 0} className="hover:text-white disabled:opacity-30">
                      ↑ Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLink(i, 1)}
                      disabled={i === links.length - 1}
                      className="hover:text-white disabled:opacity-30"
                    >
                      ↓ Bajar
                    </button>
                    <button type="button" onClick={() => removeLink(i)} className="ml-auto text-red-400 hover:text-red-300">
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Para WhatsApp usa <span className="font-mono">https://wa.me/52</span> seguido de tu número a 10 dígitos.
              Prueba siempre el enlace después de guardar.
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-500">
            En modo redirección no se muestra ninguna página: el cliente va directo al enlace. Tus botones
            adicionales se conservan por si vuelves a Micrositio.
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}