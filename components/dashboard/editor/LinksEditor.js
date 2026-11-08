"use client";

import { useState } from "react";
import { ICONS, kindOf } from "@/lib/linkIcons";

export const MAX_LINKS = 6;

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

// Resumen de una línea para el botón cerrado
function summary(l) {
  const kind = kindOf(l.icon);
  const d = l.data || {};
  if (kind === "contact") return d.name || "";
  if (kind === "wifi") return d.ssid || "";
  if (kind === "pay" && d.mode === "bank") return [d.bank, d.holder].filter(Boolean).join(" · ");
  return l.url || "";
}

// Botones adicionales del micrositio. Cada botón se abre y se cierra para que la lista no ocupe toda la pantalla.
export default function LinksEditor({ links, setLinks }) {
  const [open, setOpen] = useState(null);

  const updateLink = (i, patch) => setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  // Al cambiar de tipo de botón se limpian los datos del anterior
  const changeIcon = (i, icon) => {
    const same = kindOf(links[i].icon) === kindOf(icon);
    updateLink(i, same ? { icon } : { icon, url: "", data: {} });
  };

  const updateData = (i, patch) => updateLink(i, { data: { ...(links[i].data || {}), ...patch } });

  const removeLink = (i) => {
    setLinks(links.filter((_, idx) => idx !== i));
    setOpen(null);
  };

  const moveLink = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const copy = [...links];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setLinks(copy);
    setOpen(open === i ? j : open === j ? i : open);
  };

  const addLink = () => {
    if (links.length >= MAX_LINKS) return;
    setLinks([...links, { label: "", url: "", icon: "link", data: {} }]);
    setOpen(links.length);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
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

      <div className="space-y-2">
        {links.map((l, i) => {
          const isOpen = open === i;
          const ic = ICONS.find((x) => x.value === l.icon);
          return (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/60">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
              >
                <span className="text-lg" aria-hidden="true">{ic?.emoji || "🔗"}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-100">{l.label || "Botón sin texto"}</span>
                  <span className="block truncate text-xs text-slate-500">{summary(l) || ic?.label || "Completa los datos"}</span>
                </span>
                <span className="text-xs text-slate-500">{isOpen ? "Cerrar" : "Editar"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-800 p-3">
                  <div className="grid gap-2 sm:grid-cols-[9rem_1fr]">
                    <select value={l.icon} onChange={(e) => changeIcon(i, e.target.value)} className={inputClass}>
                      {ICONS.map((ic2) => (
                        <option key={ic2.value} value={ic2.value}>
                          {ic2.emoji} {ic2.label}
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
                  {kindOf(l.icon) === "pay" && (
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {[
                          ["link", "Enlace de pago"],
                          ["bank", "Cuenta bancaria"],
                        ].map(([mode, text]) => {
                          const current = l.data?.mode === "bank" ? "bank" : "link";
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => updateData(i, { mode })}
                              aria-pressed={current === mode}
                              className={`rounded-lg border px-3 py-2 transition ${
                                current === mode
                                  ? "border-brand-500 bg-brand-600/15 text-slate-50"
                                  : "border-slate-700 text-slate-400 hover:bg-slate-800"
                              }`}
                            >
                              {text}
                            </button>
                          );
                        })}
                      </div>
                      {l.data?.mode === "bank" ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input value={l.data?.bank || ""} onChange={(e) => updateData(i, { bank: e.target.value })} maxLength={40} placeholder="Banco (ej. BBVA)" className={inputClass} />
                          <input value={l.data?.holder || ""} onChange={(e) => updateData(i, { holder: e.target.value })} maxLength={60} placeholder="A nombre de" className={inputClass} />
                          <input value={l.data?.clabe || ""} onChange={(e) => updateData(i, { clabe: e.target.value })} inputMode="numeric" maxLength={24} placeholder="CLABE (18 dígitos)" className={`${inputClass} font-mono sm:col-span-2`} />
                          <input value={l.data?.account || ""} onChange={(e) => updateData(i, { account: e.target.value })} inputMode="numeric" maxLength={20} placeholder="Número de cuenta (opcional)" className={inputClass} />
                          <input value={l.data?.card || ""} onChange={(e) => updateData(i, { card: e.target.value })} inputMode="numeric" maxLength={24} placeholder="Tarjeta de 16 dígitos (opcional)" className={inputClass} />
                          <input value={l.data?.reference || ""} onChange={(e) => updateData(i, { reference: e.target.value })} maxLength={40} placeholder="Concepto sugerido (opcional)" className={`${inputClass} sm:col-span-2`} />
                        </div>
                      ) : (
                        <input
                          value={l.url}
                          onChange={(e) => updateLink(i, { url: e.target.value })}
                          placeholder="Enlace de pago (Mercado Pago, PayPal, etc.)"
                          className={inputClass}
                        />
                      )}
                    </div>
                  )}
                  {kindOf(l.icon) === "url" && (
                    <input
                      value={l.url}
                      onChange={(e) => updateLink(i, { url: e.target.value })}
                      placeholder={
                        l.icon === "maps"
                          ? "Enlace de Google Maps (Compartir → Copiar enlace)"
                          : "https://..."
                      }
                      className={`${inputClass} mt-2`}
                    />
                  )}
                  {kindOf(l.icon) === "phone" && (
                    <input
                      type="tel"
                      inputMode="tel"
                      value={l.url}
                      onChange={(e) => updateLink(i, { url: e.target.value })}
                      placeholder="Teléfono a 10 dígitos (ej. 55 1234 5678)"
                      className={`${inputClass} mt-2`}
                    />
                  )}
                  {kindOf(l.icon) === "email" && (
                    <input
                      type="email"
                      value={l.url}
                      onChange={(e) => updateLink(i, { url: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className={`${inputClass} mt-2`}
                    />
                  )}
                  {kindOf(l.icon) === "contact" && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <input
                        value={l.data?.name || ""}
                        onChange={(e) => updateData(i, { name: e.target.value })}
                        maxLength={60}
                        placeholder="Nombre del contacto"
                        className={inputClass}
                      />
                      <input
                        type="tel"
                        inputMode="tel"
                        value={l.data?.phone || ""}
                        onChange={(e) => updateData(i, { phone: e.target.value })}
                        placeholder="Teléfono"
                        className={inputClass}
                      />
                      <input
                        type="email"
                        value={l.data?.email || ""}
                        onChange={(e) => updateData(i, { email: e.target.value })}
                        placeholder="Correo (opcional)"
                        className={inputClass}
                      />
                    </div>
                  )}
                  {kindOf(l.icon) === "wifi" && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <input
                        value={l.data?.ssid || ""}
                        onChange={(e) => updateData(i, { ssid: e.target.value })}
                        maxLength={32}
                        placeholder="Nombre de la red"
                        className={inputClass}
                      />
                      <input
                        value={l.data?.password || ""}
                        onChange={(e) => updateData(i, { password: e.target.value })}
                        maxLength={63}
                        placeholder="Contraseña (opcional)"
                        className={inputClass}
                      />
                    </div>
                  )}
                  <div className="mt-3 flex gap-4 text-xs text-slate-400">
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
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Para WhatsApp usa <span className="font-mono">https://wa.me/52</span> seguido de tu número a 10 dígitos. Con
        «Llamar», «Mensaje SMS» y «Correo» solo escribes el dato. «Guardar contacto» baja una tarjeta al celular y «Red
        WiFi» muestra el nombre y la contraseña para copiarlas. «Pago» sirve para un enlace (Mercado Pago, PayPal…) o
        para tu cuenta bancaria, con botones de copiar. Prueba siempre los botones después de guardar.
      </p>
    </div>
  );
}
