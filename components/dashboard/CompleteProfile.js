"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

function hasText(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export default function CompleteProfile({ uid }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) return;

    // Escucha el perfil en vivo
    const unsub = onSnapshot(
      doc(db, "users", uid),
      { includeMetadataChanges: true },
      (snap) => {
        // Ignora datos de copia local: espera la respuesta real del servidor
        if (snap.metadata.fromCache) return;

        const data = snap.exists() ? snap.data() : {};
        const complete = hasText(data.name) && hasText(data.business_name);

        if (complete) {
          setShow(false);
        } else {
          setName((n) => n || data.name || "");
          setBusiness((b) => b || data.business_name || "");
          setShow(true);
        }
      },
      (err) => console.error("No se pudo leer el perfil:", err)
    );

    return () => unsub();
  }, [uid]);

  if (!show) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !business.trim()) {
      setError("Escribe tu nombre y el nombre de tu negocio.");
      return;
    }
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", uid),
        { name: name.trim().slice(0, 60), business_name: business.trim().slice(0, 80) },
        { merge: true }
      );
      setShow(false);
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <form onSubmit={handleSave} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Completa tu perfil</h2>
          <p className="mt-1 text-sm text-slate-400">Solo te lo pedimos una vez.</p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Tu nombre</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre de tu negocio</label>
          <input value={business} onChange={(e) => setBusiness(e.target.value)} maxLength={80} className={inputClass} />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}