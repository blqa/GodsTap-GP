"use client";

import { useEffect, useRef, useState } from "react";
import useAdminGuard from "@/components/admin/useAdminGuard";
import {
  BRAND_COLORS,
  DEFAULT_PHONE,
  FIREBASE_FROM,
  FIREBASE_TEMPLATES,
  FORMAT_RULES,
  REPLY_TEMPLATES,
  SENDER_NAME,
  SIGNATURES,
  previewFirebase,
  signature,
} from "@/lib/emailTemplates";
import { CONTACT_EMAIL } from "@/lib/contact";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";
const btnPrimary =
  "rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 sm:py-2";
const btnGhost =
  "rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 sm:py-2";

function selectNode(node) {
  if (!node) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// Una pieza: título, datos, vista previa y botones para copiar
function Piece({ title, where, fields, children }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-800 px-4 py-4 sm:px-5">
        <h3 className="text-base font-semibold text-slate-50">{title}</h3>
        <span className="text-xs text-slate-500">{where}</span>
      </div>
      {fields && (
        <dl className="grid gap-x-4 gap-y-1 border-b border-slate-800 px-4 py-3 text-sm sm:grid-cols-[max-content_1fr] sm:px-5">
          {fields.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="mt-1.5 text-slate-500 sm:mt-0">{k}</dt>
              <dd className="break-all font-mono text-xs text-slate-300 sm:py-0.5">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </article>
  );
}

function useFlash() {
  const [msg, setMsg] = useState("");
  const timer = useRef(null);
  const flash = (text) => {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 4000);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return [msg, flash];
}

async function copyPlain(text, flash, fallbackNode) {
  try {
    await navigator.clipboard.writeText(text);
    flash("Copiado");
  } catch {
    selectNode(fallbackNode);
    flash("Seleccionado: presiona Ctrl + C");
  }
}

function Signature({ sig, name, phone }) {
  const html = signature({ email: sig.email, role: sig.role, name, phone });
  const pv = useRef(null);
  const [status, flash] = useFlash();
  const [showCode, setShowCode] = useState(false);

  const copyRich = async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([pv.current?.innerText || ""], { type: "text/plain" }),
        }),
      ]);
      flash("Firma copiada. Pégala en Gmail");
    } catch {
      selectNode(pv.current);
      flash("Seleccionada: presiona Ctrl + C");
    }
  };

  return (
    <Piece title={sig.title} where={sig.where}>
      <div ref={pv} className="overflow-x-auto bg-white px-4 py-6 text-black" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
        <button type="button" onClick={copyRich} className={btnPrimary}>Copiar firma</button>
        <button type="button" onClick={() => setShowCode(!showCode)} className={btnGhost}>
          {showCode ? "Ocultar código" : "Ver código"}
        </button>
        <span role="status" className="text-xs text-emerald-400">{status}</span>
      </div>
      {showCode && <pre className="max-h-72 overflow-auto bg-slate-950 px-4 py-4 text-xs text-slate-300 sm:px-5">{html}</pre>}
    </Piece>
  );
}

function ReplyTemplate({ tpl }) {
  const pv = useRef(null);
  const [status, flash] = useFlash();
  return (
    <Piece title={tpl.title} where={tpl.where} fields={[["Asunto", tpl.subject]]}>
      <div ref={pv} className="whitespace-pre-wrap bg-white px-4 py-5 text-sm leading-relaxed text-neutral-900">{tpl.text}</div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
        <button type="button" onClick={() => copyPlain(tpl.text, flash, pv.current)} className={btnPrimary}>Copiar texto</button>
        <button type="button" onClick={() => copyPlain(tpl.subject, flash, null)} className={btnGhost}>Copiar asunto</button>
        <span role="status" className="text-xs text-emerald-400">{status}</span>
      </div>
    </Piece>
  );
}

function FirebaseTemplate({ tpl }) {
  const [status, flash] = useFlash();
  const [showCode, setShowCode] = useState(false);
  const codeRef = useRef(null);
  const fields = [
    ["Nombre del remitente", SENDER_NAME],
    ["Remitente (De)", FIREBASE_FROM],
    ["Responder a", CONTACT_EMAIL],
    ["Asunto", tpl.subject],
  ];
  return (
    <Piece title={tpl.title} where={`En Firebase: ${tpl.where}`} fields={fields}>
      {tpl.html ? (
        <>
          <div className="overflow-x-auto bg-white px-2 py-4 text-black" dangerouslySetInnerHTML={{ __html: previewFirebase(tpl.html) }} />
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
            <button type="button" onClick={() => copyPlain(tpl.html, flash, codeRef.current)} className={btnPrimary}>Copiar mensaje (HTML)</button>
            <button type="button" onClick={() => copyPlain(tpl.subject, flash, null)} className={btnGhost}>Copiar asunto</button>
            <button type="button" onClick={() => setShowCode(!showCode)} className={btnGhost}>
              {showCode ? "Ocultar código" : "Ver código"}
            </button>
            <span role="status" className="text-xs text-emerald-400">{status}</span>
          </div>
          {showCode && <pre ref={codeRef} className="max-h-72 overflow-auto bg-slate-950 px-4 py-4 text-xs text-slate-300 sm:px-5">{tpl.html}</pre>}
        </>
      ) : (
        <div className="px-4 py-4 text-sm text-slate-400 sm:px-5">
          En esta plantilla Firebase no deja cambiar el mensaje (es una protección contra spam). Solo ajusta remitente, responder a y asunto.
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => copyPlain(tpl.subject, flash, null)} className={btnGhost}>Copiar asunto</button>
            <span role="status" className="text-xs text-emerald-400">{status}</span>
          </div>
        </div>
      )}
    </Piece>
  );
}

const STORE_KEY = "gt-admin-firma";

export default function CorreosPage() {
  const admin = useAdminGuard();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(DEFAULT_PHONE);

  // Recuerda tu nombre y teléfono en este navegador (si no se puede, no pasa nada)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (saved?.name) setName(String(saved.name).slice(0, 60));
      if (saved?.phone) setPhone(String(saved.phone).slice(0, 30));
    } catch {
      // sin almacenamiento: se usan los valores por defecto
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ name, phone }));
    } catch {
      // ignorar
    }
  }, [name, phone]);

  if (!admin) return null;

  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">GodsTap · by God’s Plan</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">Correos con una sola voz</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Firma para Gmail, plantillas de respuesta y los correos automáticos de Firebase, todo con el mismo formato.
          Copia cada pieza y pégala donde indica.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-50">El formato</h2>
        <p className="text-sm text-slate-400">Aplica a todo correo que salga de contacto@, escrito a mano o automático.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FORMAT_RULES.map((r) => (
            <div key={r.title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">{r.title}</p>
              <p className="mt-1 text-sm text-slate-300">{r.text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {BRAND_COLORS.map((c) => (
            <span key={c.hex} className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 py-1 pl-1 pr-3 font-mono text-xs text-slate-300">
              <i className="block h-5 w-5 rounded-full border border-slate-700" style={{ background: c.hex }} />
              {c.hex} {c.label}
            </span>
          ))}
        </div>
        <p className="border-l-2 border-brand-600 pl-3 text-sm text-slate-400">
          En los correos el fondo es blanco y el negro solo va en la franja superior. Así se leen bien en cualquier app, incluso en modo oscuro.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-50">Firma de Gmail</h2>
        <p className="text-sm text-slate-400">Escribe tu nombre y teléfono; las firmas se actualizan solas y se recuerdan en este navegador.</p>
        <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sig-name" className="mb-1.5 block text-sm font-medium text-slate-300">Tu nombre</label>
            <input id="sig-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Tu nombre" className={inputClass} />
          </div>
          <div>
            <label htmlFor="sig-phone" className="mb-1.5 block text-sm font-medium text-slate-300">WhatsApp</label>
            <input id="sig-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} className={inputClass} />
          </div>
        </div>
        <div className="space-y-4">
          {SIGNATURES.map((s) => (
            <Signature key={s.title} sig={s} name={name} phone={phone} />
          ))}
        </div>
        <ol className="max-w-2xl list-decimal space-y-1.5 pl-5 text-sm text-slate-400">
          <li>Dale <b className="text-slate-200">Copiar firma</b>. Si dice que la selecciones, presiona Ctrl + C (en Mac, Cmd + C).</li>
          <li>Gmail → ⚙️ → <b className="text-slate-200">Ver toda la configuración</b> → pestaña General → <b className="text-slate-200">Firma</b> → Crear nueva. Llámala “GodsTap”.</li>
          <li>Pega en el cuadro (Ctrl + V).</li>
          <li>Repite con la de contacto. Abajo, en Configuración predeterminada de firmas, elige cuál usa cada dirección.</li>
          <li>Baja hasta el final y dale <b className="text-slate-200">Guardar cambios</b>.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-50">Plantillas para responder</h2>
        <p className="text-sm text-slate-400">Textos base para lo que más vas a escribir. Se guardan en Gmail para usarlos con dos clics.</p>
        <ol className="max-w-2xl list-decimal space-y-1.5 pl-5 text-sm text-slate-400">
          <li>Gmail → ⚙️ → Ver toda la configuración → <b className="text-slate-200">Avanzada</b> → activa <b className="text-slate-200">Plantillas</b> → Guardar cambios.</li>
          <li>Redacta un correo nuevo, pega el texto y, en los tres puntos (⋮) → Plantillas → <b className="text-slate-200">Guardar borrador como plantilla</b>.</li>
        </ol>
        <div className="space-y-4">
          {REPLY_TEMPLATES.map((t) => (
            <ReplyTemplate key={t.title} tpl={t} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-50">Correos automáticos de Firebase</h2>
        <p className="text-sm text-slate-400">Son los que tu app manda sola: verificar correo y recuperar contraseña.</p>
        <ol className="max-w-2xl list-decimal space-y-1.5 pl-5 text-sm text-slate-400">
          <li>Consola de Firebase → ⚙️ Configuración del proyecto → General → <b className="text-slate-200">Nombre público</b>: escribe <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">GodsTap</code>.</li>
          <li>Ve a <b className="text-slate-200">Authentication</b> → pestaña <b className="text-slate-200">Plantillas</b>.</li>
          <li>Abre cada plantilla con el lápiz ✏️ y copia los campos de abajo: nombre del remitente, dirección, responder a, asunto y mensaje.</li>
          <li>Guarda y pruébalo desde “Olvidé mi contraseña” en la web.</li>
        </ol>
        <p className="border-l-2 border-brand-600 pl-3 text-sm text-slate-400">
          Lo que va entre signos de porcentaje (<code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">%LINK%</code>, <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">%DISPLAY_NAME%</code>) no lo cambies: Firebase lo reemplaza por el enlace y el nombre real de cada usuario.
        </p>
        <div className="space-y-4">
          {FIREBASE_TEMPLATES.map((t) => (
            <FirebaseTemplate key={t.title} tpl={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
