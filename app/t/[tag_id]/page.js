"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore/lite";
import { dbLite } from "@/lib/firebaseLite";
import { getEmoji } from "@/lib/linkIcons";

// Solo permite http/https (bloquea javascript:, data:, etc.)
function getSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function Spinner({ label }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <svg className="h-9 w-9 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        {label && <p className="text-sm text-slate-400">{label}</p>}
      </div>
    </div>
  );
}

function ErrorState({ title, message, detail }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 ring-1 ring-slate-800">
          <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        {detail && <p className="mt-4 break-all font-mono text-xs text-slate-600">{detail}</p>}
      </div>
    </main>
  );
}

function UnclaimedState({ tagId }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-5 py-12">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />

      <div className="relative w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-700">
          <svg className="h-9 w-9 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-white">Este GT aún no está activado</h1>
        <p className="mt-2 text-sm text-slate-400">
          Si acabas de recibirlo, crea tu cuenta o inicia sesión y vincúlalo con el código de
          activación que viene en tu empaque.
        </p>

        <p className="mt-5 inline-block rounded-md bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-300 ring-1 ring-slate-700">
          ID: {tagId}
        </p>

        <div className="mt-8 space-y-3">
          <a
            href="/register"
            className="block w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-violet-500"
          >
            Crear cuenta
          </a>
          <a
            href="/login"
            className="block w-full rounded-xl border border-slate-700 px-6 py-3.5 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
          >
            Ya tengo cuenta
          </a>
        </div>

        <p className="mt-10 text-xs text-slate-600">
          <span className="font-medium text-slate-500">GodsTap</span> · by God’s Plan
        </p>
      </div>
    </main>
  );
}

function PublicTag() {
  const params = useParams();
  const rawId = Array.isArray(params?.tag_id) ? params.tag_id[0] : params?.tag_id;

  // loading | redirecting | microsite | unclaimed | notfound | error
  const [status, setStatus] = useState("loading");
  const [tag, setTag] = useState(null);
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (!rawId) return;

    let cancelled = false;

    const loadTag = async () => {
      try {
        const tagId = decodeURIComponent(rawId);
        const snap = await getDoc(doc(dbLite, "tags", tagId));

        if (cancelled) return;

        if (!snap.exists()) {
          setStatus("notfound");
          return;
        }

        const data = snap.data();

        // Sin dueño: nunca redirige ni muestra el enlace
        if (!data.owner_uid) {
          setStatus("unclaimed");
          return;
        }

        const safeUrl = getSafeUrl(data.target_url);
        setTag({ ...data, safeUrl });

        if (data.mode === "redirect") {
          if (!safeUrl) {
            setStatus("error");
            return;
          }
          setStatus("redirecting");
          window.location.replace(safeUrl);
          return;
        }

        if (data.mode === "microsite") {
          setStatus("microsite");
          return;
        }

        setStatus("error");
      } catch (err) {
        console.error("Error al cargar el tag:", err);
        if (!cancelled) {
          setDetail(err?.code || "");
          setStatus("error");
        }
      }
    };

    loadTag();

    return () => {
      cancelled = true;
    };
  }, [rawId]);

  if (status === "loading") return <Spinner />;
  if (status === "redirecting") return <Spinner label="Redirigiendo..." />;
  if (status === "unclaimed") return <UnclaimedState tagId={decodeURIComponent(rawId)} />;

  if (status === "notfound") {
    return (
      <ErrorState
        title="Tag no encontrado"
        message="Este dispositivo no existe o ya no está activo."
      />
    );
  }

  if (status === "error" || !tag) {
    return (
      <ErrorState
        title="No se pudo abrir este enlace"
        message="Ocurrió un problema al cargar la información. Inténtalo de nuevo en unos momentos."
        detail={detail}
      />
    );
  }

  // Microsite
  const businessName = tag.business_name || "Negocio";
  const initial = businessName.trim().charAt(0).toUpperCase() || "G";

  // Solo se muestran botones con texto y URL http/https válida
  const extraLinks = (Array.isArray(tag.links) ? tag.links : [])
    .map((l) => ({
      label: String(l?.label || "").slice(0, 40),
      icon: l?.icon,
      url: getSafeUrl(l?.url),
    }))
    .filter((l) => l.label && l.url)
    .slice(0, 6);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-5 py-12">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-10 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" />

      <div className="relative w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-3xl font-bold text-white shadow-xl shadow-indigo-900/40 ring-4 ring-slate-900">
          {initial}
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-white">{businessName}</h1>
        <p className="mt-1.5 text-sm text-slate-400">Toca el botón para continuar</p>

        {tag.safeUrl && (
          <a
            href={tag.safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 active:scale-[0.98]"
          >
            Visitar sitio
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        )}

        {extraLinks.length > 0 && (
          <div className={`${tag.safeUrl ? "mt-4" : "mt-8"} space-y-3`}>
            {extraLinks.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-3.5 text-left text-sm font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-900 active:scale-[0.98]"
              >
                <span className="text-lg">{getEmoji(l.icon)}</span>
                <span className="flex-1 truncate">{l.label}</span>
                <span className="text-slate-500">→</span>
              </a>
            ))}
          </div>
        )}

        {!tag.safeUrl && extraLinks.length === 0 && (
          <p className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
            Este enlace aún no está configurado.
          </p>
        )}

        <p className="mt-10 text-xs text-slate-600">
          <span className="font-medium text-slate-500">GodsTap</span> · by God’s Plan
        </p>
      </div>
    </main>
  );
}

export default function PublicTagPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PublicTag />
    </Suspense>
  );
}