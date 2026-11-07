"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

function normalizeMode(mode) {
  const value = String(mode || "").toLowerCase();
  if (["redirect", "redireccion", "redirección"].includes(value)) {
    return { label: "Redirección", style: "bg-sky-500/10 text-sky-300 ring-sky-500/30" };
  }
  if (["microsite", "micrositio"].includes(value)) {
    return { label: "Micrositio", style: "bg-violet-500/10 text-violet-300 ring-violet-500/30" };
  }
  return { label: mode || "Sin definir", style: "bg-slate-500/10 text-slate-300 ring-slate-500/30" };
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-4 h-4 w-24 rounded bg-slate-800" />
      <div className="mb-3 h-5 w-3/4 rounded bg-slate-800" />
      <div className="h-4 w-full rounded bg-slate-800" />
    </div>
  );
}

export default function DashboardPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return; // El layout se encarga de redirigir

      setLoading(true);
      setError("");

      try {
        const q = query(collection(db, "tags"), where("owner_uid", "==", user.uid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTags(data);
      } catch (err) {
        console.error("Error al cargar tags:", err);
        setError("No se pudieron cargar tus Smart Tags. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Mis Smart Tags
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Administra tus dispositivos NFC vinculados.
          </p>
        </div>
        {!loading && !error && tags.length > 0 && (
          <span className="inline-flex w-fit items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700">
            {tags.length} {tags.length === 1 ? "dispositivo" : "dispositivos"}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {/* Cargando */}
      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tags.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 ring-1 ring-slate-700">
            <svg
              className="h-8 w-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">
            No tienes Smart Tags activos
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            No tienes Smart Tags activos. Contacta a soporte para vincular un nuevo
            dispositivo.
          </p>
        </div>
      )}

      {/* Grid de tarjetas */}
      {!loading && tags.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => {
            const mode = normalizeMode(tag.mode);
            const tagId = tag.tag_id || tag.id;

            return (
              <article
                key={tag.id}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm transition hover:border-slate-700 hover:bg-slate-900"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="truncate rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300 ring-1 ring-slate-700">
                    {tagId}
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${mode.style}`}
                  >
                    {mode.label}
                  </span>
                </div>

                <h3 className="truncate text-base font-semibold text-white">
                  {tag.business_name || "Sin nombre de negocio"}
                </h3>

                <div className="mt-4 border-t border-slate-800 pt-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                    URL destino
                  </p>
                  {tag.target_url ? (
                    <a
                      href={tag.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm text-indigo-400 transition hover:text-indigo-300 hover:underline"
                      title={tag.target_url}
                    >
                      {tag.target_url}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-500">No configurada</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}