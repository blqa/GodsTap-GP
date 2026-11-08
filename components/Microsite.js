"use client";

import { useState } from "react";
import { getEmoji, kindOf } from "@/lib/linkIcons";
import { buildVCard, linkHref } from "@/lib/linkActions";
import { alpha, getSafeUrl, normalizeTheme, textOn } from "@/lib/microsite";

export default function Microsite({ name, mainUrl, links, theme, preview = false, hideBrand = false }) {
  const t = normalizeTheme(theme);
  const fg = textOn(t.bg);
  const onAccent = textOn(t.accent);

  const businessName = String(name || "").trim() || "Negocio";
  const initial = businessName.charAt(0).toUpperCase() || "G";
  const main = getSafeUrl(mainUrl);

  const [openWifi, setOpenWifi] = useState(null);
  const [copied, setCopied] = useState("");

  // Solo se muestran botones con texto y datos válidos (enlaces http/https, teléfono, correo, contacto o WiFi)
  const extra = (Array.isArray(links) ? links : [])
    .map((l) => {
      const kind = kindOf(l?.icon);
      const data = l?.data && typeof l.data === "object" ? l.data : {};
      return {
        label: String(l?.label || "").slice(0, 40),
        icon: l?.icon,
        kind,
        url: kind === "contact" || kind === "wifi" ? null : linkHref(l),
        data,
      };
    })
    .filter((l) => {
      if (!l.label) return false;
      if (l.kind === "contact") return !!String(l.data.name || "").trim();
      if (l.kind === "wifi") return !!String(l.data.ssid || "").trim();
      return !!l.url;
    })
    .slice(0, 6);

  // En la vista previa los botones no navegan
  const onClick = preview ? (e) => e.preventDefault() : undefined;

  const saveContact = (l) => {
    if (preview) return;
    try {
      const vcf = buildVCard({
        name: String(l.data.name || "").slice(0, 60),
        phone: l.data.phone,
        email: l.data.email,
        org: businessName,
      });
      const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${String(l.data.name || "contacto").replace(/[^\w\- ]+/g, "").trim() || "contacto"}.vcf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const copyText = async (key, value) => {
    if (preview) return;
    try {
      await navigator.clipboard.writeText(String(value || ""));
      setCopied(key);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      // sin permiso del portapapeles: la persona puede copiarlo a mano
    }
  };

  const rowStyle = {
    backgroundColor: alpha(fg, 0.08),
    border: `1px solid ${alpha(fg, 0.18)}`,
    color: fg,
  };
  const rowClass =
    "flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left text-sm font-medium transition hover:opacity-80 active:scale-[0.98]";

  return (
    <main
      className={`relative flex items-center justify-center overflow-hidden px-5 ${
        preview ? "min-h-full py-10" : "min-h-screen py-12"
      }`}
      style={{ backgroundColor: t.bg, color: fg }}
    >
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: alpha(t.accent, 0.25) }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-10 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: alpha(t.accent, 0.12) }}
      />

      <div className="relative w-full max-w-sm text-center">
        <div
          className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold shadow-xl"
          style={{
            backgroundColor: t.accent,
            color: onAccent,
            boxShadow: `0 0 0 4px ${t.bg}, 0 0 0 5px ${alpha(fg, 0.15)}`,
          }}
        >
          {initial}
        </div>

        <h1 className="break-words text-2xl font-semibold tracking-tight">{businessName}</h1>
        <p className="mt-1.5 text-sm" style={{ color: alpha(fg, 0.65) }}>
          Toca el botón para continuar
        </p>

        {main && (
          <a
            href={main}
            onClick={onClick}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold shadow-lg transition hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: t.accent, color: onAccent }}
          >
            Visitar sitio
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        )}

        {extra.length > 0 && (
          <div className={`${main ? "mt-4" : "mt-8"} space-y-3`}>
            {extra.map((l, i) => {
              if (l.kind === "contact") {
                return (
                  <button key={i} type="button" onClick={() => saveContact(l)} className={rowClass} style={rowStyle}>
                    <span className="text-lg">{getEmoji(l.icon)}</span>
                    <span className="flex-1 truncate">{l.label}</span>
                    <span style={{ color: alpha(fg, 0.5) }}>↓</span>
                  </button>
                );
              }
              if (l.kind === "wifi") {
                const open = openWifi === i;
                return (
                  <div key={i}>
                    <button
                      type="button"
                      onClick={() => setOpenWifi(open ? null : i)}
                      aria-expanded={open}
                      className={rowClass}
                      style={rowStyle}
                    >
                      <span className="text-lg">{getEmoji(l.icon)}</span>
                      <span className="flex-1 truncate">{l.label}</span>
                      <span style={{ color: alpha(fg, 0.5) }}>{open ? "−" : "+"}</span>
                    </button>
                    {open && (
                      <div className="mt-2 space-y-2 rounded-2xl p-4 text-left text-sm" style={{ border: `1px solid ${alpha(fg, 0.18)}` }}>
                        {[
                          ["Red", l.data.ssid, "ssid"],
                          ["Contraseña", l.data.password, "pass"],
                        ]
                          .filter(([, v]) => v)
                          .map(([name2, v, key]) => (
                            <div key={key} className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs" style={{ color: alpha(fg, 0.55) }}>{name2}</p>
                                <p className="break-all font-mono">{v}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyText(`${i}-${key}`, v)}
                                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
                                style={{ backgroundColor: t.accent, color: onAccent }}
                              >
                                {copied === `${i}-${key}` ? "Copiado" : "Copiar"}
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              }
              const web = l.url.startsWith("http");
              return (
                <a
                  key={i}
                  href={l.url}
                  onClick={onClick}
                  {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={rowClass}
                  style={rowStyle}
                >
                  <span className="text-lg">{getEmoji(l.icon)}</span>
                  <span className="flex-1 truncate">{l.label}</span>
                  <span style={{ color: alpha(fg, 0.5) }}>→</span>
                </a>
              );
            })}
          </div>
        )}

        {!main && extra.length === 0 && (
          <p
            className="mt-8 rounded-xl px-4 py-3 text-sm"
            style={{ border: `1px solid ${alpha(fg, 0.18)}`, color: alpha(fg, 0.65) }}
          >
            Este enlace aún no está configurado.
          </p>
        )}

        {!hideBrand && (
          <p className="mt-10 text-xs" style={{ color: alpha(fg, 0.45) }}>
            <span className="font-medium">GodsTap</span> · by God’s Plan
          </p>
        )}
      </div>
    </main>
  );
}