"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore/lite";
import { dbLite } from "@/lib/firebaseLite";
import Microsite from "@/components/Microsite";
import { countClick, countScan } from "@/lib/scans";
import { tagIsPaid, tagShowBrand } from "@/lib/plans";
import { LogoMark } from "@/components/Logo";
import SuggestButton from "@/components/SuggestButton";

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
        <svg className="h-9 w-9 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
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
        <h1 className="text-lg font-semibold text-slate-50">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        {detail && <p className="mt-4 break-all font-mono text-xs text-slate-600">{detail}</p>}
      </div>
    </main>
  );
}

const SETUP_STEPS = [
  { title: "Crea tu cuenta", desc: "Toma un minuto. Si ya tienes cuenta, solo inicia sesión." },
  { title: "Vincula este GT", desc: "En tu panel toca «+ Vincular nuevo GT» y escribe el ID de abajo y el código de activación de tu empaque." },
  { title: "Configúralo", desc: "Pon el nombre de tu negocio y elige qué ven tus clientes: tu menú, tu WhatsApp, tus reseñas…" },
  { title: "¡Listo para usarse!", desc: "Acerca tu celular a este GT y tu página aparece al instante." },
];

function UnclaimedState({ tagId }) {
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(tagId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* si el navegador no deja copiar, el ID sigue visible para escribirlo */
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-5 py-12">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <div className="text-center">
          <LogoMark className="mx-auto mb-5 h-14 w-14" />
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">¡Bienvenido a GodsTap!</h1>
          <p className="mt-2 text-sm text-slate-400">
            Este GT todavía no está activado. Sigue estos pasos y en menos de un minuto estará funcionando.
          </p>
        </div>

        <ol className="mt-8 space-y-3">
          {SETUP_STEPS.map((st, i) => (
            <li key={st.title} className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 font-display text-sm font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-50">{st.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{st.desc}</p>
                {i === 1 && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="min-w-0 truncate rounded-md bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-200 ring-1 ring-slate-700">
                      {tagId}
                    </span>
                    <button
                      type="button"
                      onClick={copyId}
                      className="shrink-0 rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                    >
                      {copied ? "¡Copiado!" : "Copiar ID"}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 space-y-3">
          <a
            href="/register"
            className="block w-full rounded-xl bg-brand-600 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-500"
          >
            Crear mi cuenta
          </a>
          <a
            href="/login"
            className="block w-full rounded-xl border border-slate-700 px-6 py-3.5 text-center text-sm font-medium text-slate-200 transition hover:bg-slate-900"
          >
            Ya tengo cuenta
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          ¿Dudas o ideas?{" "}
          <SuggestButton variant="link" label="Escríbenos" context={`GT sin activar ${tagId}`} />
        </p>
        <p className="mt-4 text-center text-xs text-slate-600">
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
        // Cuenta el escaneo (solo GT con dueño). No bloquea el micrositio.
        const counted = countScan(tagId, data.owner_uid);
        const safeUrl = getSafeUrl(data.target_url);
        setTag({ ...data, safeUrl });

        if (data.mode === "redirect") {
          if (!safeUrl) {
            setStatus("error");
            return;
          }
          setStatus("redirecting");
          await counted;          
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

  // Cuenta qué botón tocan (para las estadísticas del dueño)
  const ownerUid = tag?.owner_uid;
  const onAction = useCallback(
    (label) => {
      if (rawId && ownerUid) countClick(decodeURIComponent(rawId), ownerUid, label);
    },
    [rawId, ownerUid]
  );

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

  // Microsite (botones extra, colores y quitar la marca son de planes de pago)
  const paid = tagIsPaid(tag);
  return (
    <Microsite
      name={tag.business_name}
      tagline={tag.tagline}
      mainUrl={tag.target_url}
      links={paid ? tag.links : []}
      menu={paid ? tag.menu : undefined}
      theme={paid ? tag.theme : undefined}
      logo={paid ? tag.logo : undefined}
      cover={paid ? tag.cover : undefined}
      gallery={paid ? tag.gallery : undefined}
      hours={tag.hours}
      onAction={onAction}
      hideBrand={!tagShowBrand(tag)}
    />
  );
}

export default function PublicTagPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PublicTag />
    </Suspense>
  );
}