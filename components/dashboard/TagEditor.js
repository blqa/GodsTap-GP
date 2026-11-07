"use client";

import { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { ICONS } from "@/lib/linkIcons";
import { PRESETS, brightness, normalizeTheme } from "@/lib/microsite";
import { PLANS, formatDate, planStatus, tagIsPaid, tagShowBrand } from "@/lib/plans";
import { whatsappLink } from "@/lib/contact";
import Microsite from "@/components/Microsite";

const MAX_LINKS = 6;

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

function isValidUrl(url) {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

function Locked({ title, tagId, children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-4">
      <div className="flex items-center gap-2">
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v7a2 2 0 002 2h8a2 2 0 002-2V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clipRule="evenodd" /></svg>
        <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
        <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs text-brand-300 ring-1 ring-brand-500/30">
          Pro
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400">{children}</p>
      <a
        href={whatsappLink("Hola, quiero el plan Pro de GodsTap para mi GT " + tagId)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm text-brand-400 hover:underline"
      >
        Pedir el plan Pro
      </a>
    </div>
  );
}

export default function TagEditor({ tag, onClose, onSaved }) {
  const paid = tagIsPaid(tag);
  const status = planStatus(tag);

  const [name, setName] = useState(tag.business_name || "");
  const [mode, setMode] = useState(tag.mode === "redirect" ? "redirect" : "microsite");
  const [url, setUrl] = useState(tag.target_url || "");
  const [nickname, setNickname] = useState(tag.nickname || "");  
  const [theme, setTheme] = useState(normalizeTheme(tag.theme));
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

  const lowContrast = Math.abs(brightness(theme.bg) - brightness(theme.accent)) < 45;

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

    const cleanNick = nickname.trim();
    if (cleanNick.length > 40) {
      setError("El nombre de tu GT puede tener máximo 40 caracteres.");
      return;
    }

    const payload = {
      nickname: cleanNick,
      business_name: cleanName,
      mode,
      target_url: cleanUrl,
      updated_at: serverTimestamp(),
    };

    // Botones y colores solo se guardan en planes de pago
    if (paid) {
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
      payload.links = cleanLinks;
      payload.theme = { bg: theme.bg, accent: theme.accent };
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "tags", tag.id), payload);
      await onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar. Inténtalo de nuevo.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSave}
        className="mx-auto my-4 w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:my-6 sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-50">
              Editar GT <span className="font-mono text-sm text-slate-400">{tag.id}</span>
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                paid
                  ? "bg-brand-500/10 text-brand-300 ring-brand-500/30"
                  : "bg-slate-500/10 text-slate-400 ring-slate-500/30"
              }`}
            >
              {status.expired
                ? `Plan ${PLANS[status.plan].label} vencido el ${formatDate(status.until)}`
                : `Plan ${PLANS[status.plan].label}${status.until ? ` · vence el ${formatDate(status.until)}` : ""}`}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-500 hover:text-slate-50">
            ✕
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Columna izquierda: formulario */}
          <div className="space-y-5">
            {error && (
              <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre de este GT</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={40}
                placeholder="Ej. Mostrador, Mesa 3, Sucursal Centro"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                Es para que tú los distingas. No aparece en tu micrositio y no cambia el link del chip ({tag.id}).
              </p>
            </div>
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

            {mode === "microsite" && !paid && (
              <div className="space-y-3 border-t border-slate-800 pt-5">
                <Locked title="Colores personalizados" tagId={tag.id}>
                  Elige paletas o los colores de tu marca para tu micrositio.
                </Locked>
                <Locked title="Botones adicionales" tagId={tag.id}>
                  Agrega hasta {MAX_LINKS} botones: WhatsApp, Instagram, menú, ubicación, reseñas y más.
                </Locked>
              </div>
            )}

            {mode === "microsite" && paid && (
              <>
                {/* Colores */}
                <div className="border-t border-slate-800 pt-5">
                  <h3 className="text-sm font-semibold text-slate-50">Colores</h3>
                  <p className="mb-3 text-xs text-slate-500">Elige una paleta o ajusta los colores a tu gusto.</p>

                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => {
                      const selected = p.bg === theme.bg && p.accent === theme.accent;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setTheme({ bg: p.bg, accent: p.accent })}
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                            selected
                              ? "border-brand-500 bg-brand-500/10 text-white"
                              : "border-slate-700 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-slate-600"
                            style={{ backgroundColor: p.bg }}
                          >
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.accent }} />
                          </span>
                          {p.name}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="color"
                        value={theme.bg}
                        onChange={(e) => setTheme({ ...theme, bg: e.target.value })}
                        className="h-9 w-12 cursor-pointer rounded border border-slate-700 bg-transparent p-0.5"
                      />
                      Fondo
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="color"
                        value={theme.accent}
                        onChange={(e) => setTheme({ ...theme, accent: e.target.value })}
                        className="h-9 w-12 cursor-pointer rounded border border-slate-700 bg-transparent p-0.5"
                      />
                      Color de botones
                    </label>
                  </div>

                  {lowContrast && (
                    <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                      Los dos colores son muy parecidos y el botón principal casi no se va a notar. Prueba con
                      colores más distintos.
                    </p>
                  )}
                </div>

                {/* Botones adicionales */}
                <div className="border-t border-slate-800 pt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-50">Botones adicionales</h3>
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
                          <button type="button" onClick={() => moveLink(i, -1)} disabled={i === 0} className="hover:text-slate-50 disabled:opacity-30">
                            ↑ Subir
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLink(i, 1)}
                            disabled={i === links.length - 1}
                            className="hover:text-slate-50 disabled:opacity-30"
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
                    Para WhatsApp usa <span className="font-mono">https://wa.me/52</span> seguido de tu número a 10
                    dígitos. Prueba siempre el enlace después de guardar.
                  </p>
                </div>
              </>
            )}

            {mode === "redirect" && (
              <p className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-500">
                En modo redirección no se muestra ninguna página: el cliente va directo al enlace.
              </p>
            )}
          </div>

          {/* Columna derecha: vista previa */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <p className="mb-3 text-center text-xs font-medium text-slate-500">
              Vista previa
            </p>
            {mode === "microsite" ? (
              <div className="mx-auto w-full max-w-[300px] rounded-[2.5rem] border-4 border-slate-700 bg-slate-800 p-2 shadow-xl">
                <div className="h-[560px] overflow-y-auto rounded-[2rem]">
                  <Microsite
                    preview
                    name={name}
                    mainUrl={url}
                    links={paid ? links : []}
                    theme={paid ? theme : undefined}
                    hideBrand={!tagShowBrand(tag)}
                  />
                </div>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-[300px] rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">
                En modo redirección no hay página que mostrar. El cliente irá directo a tu enlace.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-5">
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
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}