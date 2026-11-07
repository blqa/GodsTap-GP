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
import TagEditor from "@/components/dashboard/TagEditor";
import ScansPanel from "@/components/dashboard/ScansPanel";

const BASE_URL = "https://godstap.godsplan.site";
const DEFAULT_NAME = "GT sin activar";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30";

function isValidUrl(url) {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

function isPlaceholderUrl(url) {
  return !url || url.replace(/\/$/, "") === BASE_URL;
}

function needsSetup(tag) {
  return tag.business_name === DEFAULT_NAME || isPlaceholderUrl(tag.target_url);
}

function modeStyle(mode) {
  if (mode === "redirect")
    return { label: "Redirección", style: "bg-sky-500/10 text-sky-300 ring-sky-500/30" };
  if (mode === "microsite")
    return { label: "Micrositio", style: "bg-violet-500/10 text-violet-300 ring-violet-500/30" };
  return { label: mode || "Sin definir", style: "bg-slate-500/10 text-slate-300 ring-slate-500/30" };
}

/* ---------------------------------------------------------------
   Asistente de configuración rápida
   Pasos: 0 bienvenida | 1 nombre | 2 modo | 3 enlace | 4 listo
---------------------------------------------------------------- */
function SetupWizard({ tag, startStep = 0, onClose, onClaimAnother, onSaved }) {
  const [step, setStep] = useState(startStep);
  const [name, setName] = useState(tag.business_name === DEFAULT_NAME ? "" : tag.business_name || "");
  const [mode, setMode] = useState(tag.mode === "redirect" ? "redirect" : "microsite");
  const [url, setUrl] = useState(isPlaceholderUrl(tag.target_url) ? "" : tag.target_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const goNext = () => {
    setError("");
    if (step === 1) {
      const n = name.trim();
      if (!n || n.length > 80) {
        setError("Escribe el nombre de tu negocio (máximo 80 caracteres).");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSave = async () => {
    setError("");
    const link = url.trim();
    if (!isValidUrl(link)) {
      setError("El enlace debe empezar con http:// o https://");
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "tags", tag.id), {
        business_name: name.trim(),
        mode,
        target_url: link,
        updated_at: serverTimestamp(),
      });
      await onSaved();
      setStep(4);
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const showProgress = step >= 1 && step <= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 text-slate-500 transition hover:text-white"
        >
          ✕
        </button>

        {showProgress && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              Paso {step} de 3
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* 0. Bienvenida */}
        {step === 0 && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-2xl ring-1 ring-emerald-500/30">
              ✓
            </div>
            <h2 className="text-xl font-semibold text-white">¡GT vinculado!</h2>
            <p className="mt-2 text-sm text-slate-400">
              <span className="font-mono text-slate-300">{tag.id}</span> ya es tuyo. Configúralo en
              menos de un minuto o hazlo después desde tu panel.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => setStep(1)}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Configurar ahora
              </button>
              <button
                onClick={onClaimAnother}
                className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Vincular otro GT
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-sm text-slate-400 transition hover:text-white"
              >
                Hacerlo más tarde
              </button>
            </div>
          </div>
        )}

        {/* 1. Nombre */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-white">¿Cómo se llama tu negocio?</h2>
            <p className="mt-1 text-sm text-slate-400">Es el nombre que verán tus clientes al escanear.</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goNext()}
              maxLength={80}
              placeholder="Ej. Tacos El Güero"
              className={`${inputClass} mt-5`}
            />
          </div>
        )}

        {/* 2. Modo */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-white">¿Qué pasa al escanear?</h2>
            <p className="mt-1 text-sm text-slate-400">Puedes cambiarlo cuando quieras.</p>
            <div className="mt-5 space-y-3">
              {[
                {
                  value: "microsite",
                  title: "Micrositio",
                  desc: "Una página con el nombre de tu negocio y un botón destacado.",
                },
                {
                  value: "redirect",
                  title: "Redirección directa",
                  desc: "Lleva al cliente de inmediato a tu enlace, sin pantalla intermedia.",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    mode === opt.value
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-slate-700 bg-slate-950 hover:border-slate-600"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{opt.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Enlace */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-white">
              {mode === "redirect" ? "¿A qué enlace quieres llevar a tus clientes?" : "¿A dónde lleva tu botón principal?"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Puede ser tu menú, WhatsApp, Instagram, reseñas de Google, tu sitio web...
            </p>
            <input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="https://..."
              className={`${inputClass} mt-5`}
            />
          </div>
        )}

        {/* 4. Listo */}
        {step === 4 && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-2xl ring-1 ring-emerald-500/30">
              🎉
            </div>
            <h2 className="text-xl font-semibold text-white">¡Listo, {name.trim()}!</h2>
            <p className="mt-2 text-sm text-slate-400">
              Tu GT ya está configurado. Acércale tu celular para probarlo.
            </p>
            <div className="mt-6 space-y-3">
              <a
                href={`/t/${tag.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Probar mi enlace
              </a>
              <button
                onClick={onClaimAnother}
                className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Vincular otro GT
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-sm text-slate-400 transition hover:text-white"
              >
                Ir a mis GT
              </button>
            </div>
          </div>
        )}

        {/* Navegación pasos 1-3 */}
        {showProgress && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Hacerlo más tarde
            </button>
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  onClick={() => {
                    setError("");
                    setStep(step - 1);
                  }}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  Atrás
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={goNext}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar y terminar"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Página principal del dashboard
---------------------------------------------------------------- */
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

  // Asistente
  const [wizard, setWizard] = useState(null); // { tag, startStep }

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
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTags(list);
      return list;
    } catch (err) {
      console.error("Error al cargar tags:", err);
      setError("No se pudieron cargar tus GT. Inténtalo de nuevo.");
      return [];
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

      setClaimForm({ tag_id: "", code: "" });
      setShowClaim(false);

      const list = await loadTags(user.uid);
      const claimed = list.find((t) => t.id === tagId);
      if (claimed) setWizard({ tag: claimed, startStep: 0 });
    } catch (err) {
      console.error("Error al vincular:", err);
      setClaimError(
        "No pudimos vincular este GT. Revisa el ID y el código, o puede que ya esté vinculado a otra cuenta."
      );
    } finally {
      setClaiming(false);
    }
  };

  const claimAnother = () => {
    setWizard(null);
    setClaimForm({ tag_id: "", code: "" });
    setClaimError("");
    setShowClaim(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      {/* Asistente */}
      {wizard && (
        <SetupWizard
          key={wizard.tag.id + wizard.startStep}
          tag={wizard.tag}
          startStep={wizard.startStep}
          onClose={() => setWizard(null)}
          onClaimAnother={claimAnother}
          onSaved={() => loadTags(user.uid)}
        />
      )}

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

      {/* Editor */}
      {editing && (
        <TagEditor
          tag={editing}
          onClose={() => setEditing(null)}
          onSaved={() => loadTags(user.uid)}
        />
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
      
      {/* Estadísticas */}
      {user && !loading && tags.length > 0 && <ScansPanel uid={user.uid} tags={tags} />}
      {/* Tarjetas */}
      {!loading && tags.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => {
            const mode = modeStyle(tag.mode);
            const pending = needsSetup(tag);
            return (
              <article
                key={tag.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700 hover:bg-slate-900"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="truncate rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300 ring-1 ring-slate-700">
                    {tag.id}
                  </span>
                  {pending ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
                      Falta configurar
                    </span>
                  ) : (
                    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${mode.style}`}>
                      {mode.label}
                    </span>
                  )}
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
                  {pending && (
                    <button
                      onClick={() => setWizard({ tag, startStep: 1 })}
                      className="font-medium text-amber-300 hover:underline"
                    >
                      Configurar
                    </button>
                  )}
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