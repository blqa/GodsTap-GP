"use client";

// Admin → Reseñas: pegas el link de Google Maps de un negocio (corto o completo)
// y sale su link directo para dejar reseña en Google.

import { useEffect, useState } from "react";
import useAdminGuard from "@/components/admin/useAdminGuard";
import { featureIdToPlaceId, mapsUrl, parseMapsLink, reviewUrl } from "@/lib/reviewLink";

const HISTORY_KEY = "gt-admin-resenas";
const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function CopyButton({ text, label = "Copiar" }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      window.prompt("Cópialo de aquí:", text);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
    >
      {done ? "¡Copiado!" : label}
    </button>
  );
}

export default function AdminReviewsPage() {
  const admin = useAdminGuard();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => setHistory(readHistory()), []);

  const remember = (r) => {
    const item = { name: r.name || "", link: r.link, at: Date.now() };
    const next = [item, ...readHistory().filter((h) => h.link !== r.link)].slice(0, 15);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // sin almacenamiento: no pasa nada
    }
  };

  const finish = (r) => {
    setResult(r);
    remember(r);
  };

  const run = async (value = input) => {
    setError("");
    setResult(null);
    let parsed = parseMapsLink(value);

    // Link corto: se abre en el servidor para ver a dónde lleva
    if (parsed.short) {
      setBusy(true);
      try {
        const res = await fetch(`/api/maps-link?u=${encodeURIComponent(parsed.short)}`);
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "No se pudo abrir el link corto.");
        parsed = parseMapsLink(data.url);
        if (parsed.error || parsed.short) {
          const fromPage = data.pagePlaceId || featureIdToPlaceId(data.pageFeature || "");
          if (fromPage) {
            parsed = { placeId: fromPage, name: parsed.name || "", how: "Sacado de la página del lugar.", check: true };
          }
        }
        if (parsed.short) parsed = { error: "El link corto no llevó a un lugar de Maps. Prueba con el link completo." };
      } catch (err) {
        parsed = { error: err.message };
      } finally {
        setBusy(false);
      }
    }

    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    if (parsed.direct) {
      finish({ name: parsed.name, link: parsed.direct, how: parsed.how });
      return;
    }
    finish({
      name: parsed.name,
      placeId: parsed.placeId,
      link: reviewUrl(parsed.placeId),
      check: parsed.check,
      how: parsed.how,
    });
  };

  if (!admin) return <p className="text-sm text-slate-400">Cargando...</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-50">Link de reseñas de Google</h1>
      <p className="mt-1 text-sm text-slate-400">
        Pega el link de Google Maps del negocio (corto <span className="font-mono text-slate-300">maps.app.goo.gl/…</span> o completo) y
        te doy el link que abre directo la ventana para dejar reseña.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5"
      >
        <label htmlFor="maps" className="block text-sm font-medium text-slate-300">
          Link de Google Maps del negocio
        </label>
        <textarea
          id="maps"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (pasted) {
              e.preventDefault();
              setInput(pasted);
              run(pasted);
            }
          }}
          placeholder="https://maps.app.goo.gl/… o https://www.google.com/maps/place/…"
          className={`${inputClass} resize-y font-mono`}
          autoFocus
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Abriendo link..." : "Sacar link de reseñas"}
          </button>
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput("");
                setResult(null);
                setError("");
              }}
              className="text-sm text-slate-400 hover:text-slate-200"
            >
              Limpiar
            </button>
          )}
          <span className="text-xs text-slate-500">Al pegar se genera solo.</span>
        </div>
      </form>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {result && (
        <section className="mt-4 space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5" aria-live="polite">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Link de reseñas listo</p>
            {result.name && <p className="mt-1 text-lg font-semibold text-slate-50">{result.name}</p>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="block min-w-0 flex-1 break-all rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200">
              {result.link}
            </code>
            <CopyButton text={result.link} />
          </div>
          {result.check && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
              Lo saqué de la página del lugar, no del link. Ábrelo una vez para confirmar que es el negocio correcto.
            </p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href={result.link} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-400 hover:underline">
              Probar el link ↗
            </a>
            {result.placeId && (
              <a href={mapsUrl(result.placeId)} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:underline">
                Ver el lugar en Maps ↗
              </a>
            )}
            {result.placeId && (
              <span className="text-slate-500">
                Place ID: <span className="font-mono text-slate-400">{result.placeId}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Para el cliente: en su editor, pestaña Botones → «Agregar botón de reseñas» y pega este link.
          </p>
        </section>
      )}

      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-300">Últimos que generaste (solo en este navegador)</h2>
          <ul className="mt-3 divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/40">
            {history.map((h) => (
              <li key={h.link} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">{h.name || "Sin nombre"}</p>
                  <p className="truncate font-mono text-xs text-slate-500">{h.link}</p>
                </div>
                <CopyButton text={h.link} />
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  );
}
