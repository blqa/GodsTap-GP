"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

const EMPTY_FORM = { tag_id: "", business_name: "", mode: "microsite", target_url: "" };

function isValidUrl(url) {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

function modeStyle(mode) {
  if (mode === "redirect") return { label: "Redirección", style: "bg-sky-500/10 text-sky-300 ring-sky-500/30" };
  if (mode === "microsite") return { label: "Micrositio", style: "bg-violet-500/10 text-violet-300 ring-violet-500/30" };
  return { label: mode || "Sin definir", style: "bg-slate-500/10 text-slate-300 ring-slate-500/30" };
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");

  const loadTags = async (uid) => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "tags"), where("owner_uid", "==", uid));
      const snapshot = await getDocs(q);
      setTags(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error al cargar tags:", err);
      setError("No se pudieron cargar tus Smart Tags. Inténtalo de nuevo.");
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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleEdit = (tag) => {
    setForm({
      tag_id: tag.tag_id || tag.id,
      business_name: tag.business_name || "",
      mode: tag.mode || "microsite",
      target_url: tag.target_url || "",
    });
    setFormError("");
    setFormOk("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormOk("");

    const tagId = form.tag_id.trim();
    if (!tagId || /[\/\s]/.test(tagId)) {
      setFormError("El Tag ID no puede estar vacío ni contener espacios o '/'.");
      return;
    }
    if (!isValidUrl(form.target_url.trim())) {
      setFormError("La URL debe empezar con http:// o https://");
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, "tags", tagId), {
        tag_id: tagId,
        owner_uid: user.uid,
        business_name: form.business_name.trim(),
        mode: form.mode,
        target_url: form.target_url.trim(),
      });
      setFormOk(`Tag "${tagId}" guardado correctamente.`);
      setForm(EMPTY_FORM);
      await loadTags(user.uid);
    } catch (err) {
      console.error(err);
      setFormError(
        err.code === "permission-denied"
          ? "Ese Tag ID ya existe y pertenece a otra cuenta. Usa otro ID."
          : "No se pudo guardar. Inténtalo de nuevo."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Mis Smart Tags</h1>
          <p className="mt-1 text-sm text-slate-400">Administra tus dispositivos NFC vinculados.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormError("");
            setFormOk("");
          }}
          className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500"
        >
          {showForm ? "Cerrar formulario" : "+ Nuevo tag"}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <h2 className="text-base font-semibold text-white">Crear o editar tag</h2>

          {formError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {formError}
            </div>
          )}
          {formOk && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {formOk}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Tag ID</label>
              <input name="tag_id" value={form.tag_id} onChange={handleChange} placeholder="12345" required className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre del negocio</label>
              <input name="business_name" value={form.business_name} onChange={handleChange} placeholder="Mi Negocio" required className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Modo</label>
              <select name="mode" value={form.mode} onChange={handleChange} className={inputClass}>
                <option value="microsite">Micrositio</option>
                <option value="redirect">Redirección</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">URL destino</label>
              <input name="target_url" value={form.target_url} onChange={handleChange} placeholder="https://..." required className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar tag"}
          </button>
        </form>
      )}

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Cargando tus tags...</p>}

      {/* Estado vacío */}
      {!loading && !error && tags.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-20 text-center">
          <h2 className="text-lg font-semibold text-white">No tienes Smart Tags activos</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            No tienes Smart Tags activos. Contacta a soporte para vincular un nuevo dispositivo.
          </p>
        </div>
      )}

      {/* Tarjetas */}
      {!loading && tags.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => {
            const mode = modeStyle(tag.mode);
            const tagId = tag.tag_id || tag.id;
            return (
              <article
                key={tag.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700 hover:bg-slate-900"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="truncate rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300 ring-1 ring-slate-700">
                    {tagId}
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
                  <a href={`/t/${tagId}`} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white hover:underline">
                    Probar enlace
                  </a>
                  <button onClick={() => handleEdit(tag)} className="text-slate-300 hover:text-white hover:underline">
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