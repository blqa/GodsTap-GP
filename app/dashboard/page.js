"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30";

function isValidUrl(url) {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

function modeStyle(mode) {
  if (mode === "redirect")
    return { label: "Redirección", style: "bg-sky-500/10 text-sky-300 ring-sky-500/30" };
  if (mode === "microsite")
    return { label: "Micrositio", style: "bg-violet-500/10 text-violet-300 ring-violet-500/30" };
  return { label: mode || "Sin definir", style: "bg-slate-500/10 text-slate-300 ring-slate-500/30" };
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Vincular GT
  const [showClaim, setShowClaim] = useState(false);
  const [claimForm, setClaimForm] = useState({ tag_id: "", code: "" });
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimOk, setClaimOk] = useState("");

  // Editar GT
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ business_name: "", mode: "microsite", target_url: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const loadTags = async (uid) => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "tags"), where("owner_uid", "==", uid));
      const snapshot = await getDocs(q);
      setTags(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error al cargar tags:", err);
      setError("No se pudieron cargar tus GT. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) return; // El layout redirige a /login
      setUser(u);
      loadTags(u.uid);
    });
    return () => unsubscribe();
  }, []);

  const handleClaim = async (e) => {
    e.preventDefault();
    setClaimError("");
    setClaimOk("");

    const tagId = claimForm.tag_id.trim().toLowerCase();
    const code = claimForm.code.trim().toUpperCase().replace(/\s+/g, "");

    if (!tagId || /[\/\s]/.test(tagId) || !code) {
      setClaimError("Escribe el ID del GT y su código de activación.");
      return;
    }

    setClaiming(true);
    try {
      // Las dos escrituras se validan juntas: o pasan las dos o no pasa ninguna.
      const batch = writeBatch(db);
      batch.set(doc(db, "claims", tagId), { owner_uid: user.uid, code });
      batch.update(doc(db, "tags", tagId), {
        owner_uid: user.uid,
        status: "active",
        claimed_at: serverTimestamp(),
      });
      await batch.commit();

      setClaimOk(`GT "${tagId}" vinculado a tu cuenta.`);
      setClaimForm({ tag_id: "", code: "" });
      await loadTags(user.uid);
    } catch (err) {
      console.error("Error al vincular:", err);
      setClaimError(
        "No pudimos vincular este GT. Revisa el ID y el código, o puede que ya esté vinculado a otra cuenta."
      );
    } finally {
      setClaiming(false);
    }
  };

  const startEdit = (tag) => {
    setEditing(tag);
    setEditForm({
      business_name: tag.business_name || "",
      mode: tag.mode || "microsite",
      target_url: tag.target_url || "",
    });
    setEditError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError("");

    const url = editForm.target_url.trim();
    const name = editForm.business_name.trim();

    if (!name || name.length > 80) {
      setEditError("El nombre es obligatorio (máximo 80 caracteres).");
      return;
    }
    if (!isValidUrl(url)) {
      setEditError("La URL debe empezar con http:// o https://");
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "tags", editing.id), {
        business_name: name,
        mode: editForm.mode,
        target_url: url,
        updated_at: serverTimestamp(),
      });
      setEditing(null);
      await loadTags(user.uid);
    } catch (err) {
      console.error(err);
      setEditError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Mis GT</h1>
          <p className="mt-1 text-sm text-slate-400">Administra tus dispositivos NFC vinculados.</p>
        </div>
        <button
          onClick={() => {
            setShowClaim(!showClaim);
            setClaimError("");
            setClaimOk("");
          }}
          className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500"
        >
          {showClaim ? "Cerrar" : "+ Vincular nuevo GT"}
        </button>
      </div>

      {/* Panel: vincular */}
      {showClaim && (
        <form
          onSubmit={handleClaim}
          className="mb-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <div>
            <h2 className="text-base font-semibold text-white">Vincular un GT</h2>
            <p className="mt-1 text-sm text-slate-400">
              Escribe el ID y el código de activación que vienen con tu producto.
            </p>
          </div>

          {claimError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {claimError}
            </div>
          )}
          {claimOk && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {claimOk}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">ID del GT</label>
              <input
                value={claimForm.tag_id}
                onChange={(e) => setClaimForm({ ...claimForm, tag_id: e.target.value })}
                placeholder="gt-k7f3q9"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Código de activación</label>
              <input
                value={claimForm.code}
                onChange={(e) => setClaimForm({ ...claimForm, code: e.target.value })}
                placeholder="XXXXXXXXXX"
                required
                autoComplete="off"
                className={`${inputClass} font-mono uppercase`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={claiming}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {claiming ? "Vinculando..." : "Vincular"}
          </button>
        </form>
      )}

      {/* Panel: editar */}
      {editing && (
        <form
          onSubmit={handleSaveEdit}
          className="mb-8 space-y-4 rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-6"
        >
          <h2 className="text-base font-semibold text-white">
            Editar GT <span className="font-mono text-sm text-slate-400">{editing.id}</span>
          </h2>

          {editError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {editError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre del negocio</label>
              <input
                value={editForm.business_name}
                onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                required
                maxLength={80}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Modo</label>
              <select
                value={editForm.mode}
                onChange={(e) => setEditForm({ ...editForm, mode: e.target.value })}
                className={inputClass}
              >
                <option value="microsite">Micrositio</option>
                <option value="redirect">Redirección</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">URL destino</label>
              <input
                value={editForm.target_url}
                onChange={(e) => setEditForm({ ...editForm, target_url: e.target.value })}
                placeholder="https://..."
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Cargando tus GT...</p>}

      {/* Estado vacío */}
      {!loading && !error && tags.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-20 text-center">
          <h2 className="text-lg font-semibold text-white">Aún no tienes GT vinculados</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Presiona "Vincular nuevo GT" e ingresa el ID y el código de activación que vienen con tu producto.
          </p>
        </div>
      )}

      {/* Tarjetas */}
      {!loading && tags.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => {
            const mode = modeStyle(tag.mode);
            return (
              <article
                key={tag.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700 hover:bg-slate-900"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="truncate rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300 ring-1 ring-slate-700">
                    {tag.id}
                  </span>
                  <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${mode.style}`}>
                    {mode.label}
                  </span>
                </div>

                <h3 className="truncate text-base font-semibold text-white">
                  {tag.business_name || "Sin nombre de negocio"}
                </h3>

                <div className="mt-4 border-t border-slate-800 pt-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">URL destino</p>
                  <p className="truncate text-sm text-indigo-400" title={tag.target_url}>
                    {tag.target_url || "No configurada"}
                  </p>
                </div>

                <div className="mt-4 flex gap-4 text-sm">
                  <a
                    href={`/t/${tag.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white hover:underline"
                  >
                    Probar enlace
                  </a>
                  <button onClick={() => startEdit(tag)} className="text-slate-300 hover:text-white hover:underline">
                    Editar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}