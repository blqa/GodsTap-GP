"use client";

import { LogoMark } from "@/components/Logo";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
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
import { PLANS, formatDate, planStatus, tagIsPaid } from "@/lib/plans";
import { whatsappLink } from "@/lib/contact";
import { logEvent } from "@/lib/audit";

const BASE_URL = "https://godstap.godsplan.site";
const DEFAULT_NAME = "GT sin activar";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

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
    return { label: "Micrositio", style: "bg-brand-500/10 text-brand-300 ring-brand-500/30" };
  return { label: mode || "Sin definir", style: "bg-slate-500/10 text-slate-300 ring-slate-500/30" };
}

/* ---------------------------------------------------------------
   Aviso: planes por vencer o vencidos
---------------------------------------------------------------- */
function PlanNotice({ tags }) {
  const statuses = tags.map((t) => ({ tag: t, st: planStatus(t) }));
  const expired = statuses.filter((x) => x.st.expired);
  const soon = statuses.filter((x) => x.st.expiringSoon);
  if (expired.length === 0 && soon.length === 0) return null;

  const name = (x) => x.tag.nickname || x.tag.business_name || x.tag.id;
  const renewMsg = `Hola, quiero renovar mi plan de GodsTap (${[...expired, ...soon].map((x) => x.tag.id).join(", ")})`;

  return (
    <section
      role="status"
      className={`mb-8 rounded-2xl border p-5 ${
        expired.length > 0 ? "border-red-500/30 bg-red-500/10" : "border-amber-500/30 bg-amber-500/10"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5 text-sm">
          {expired.map((x) => (
            <p key={x.tag.id} className="text-red-300">
              <span className="font-semibold">{name(x)}</span>: tu plan {PLANS[x.st.plan].label} venció el {formatDate(x.st.until)}. Volvió a Básico:
              se ocultan los botones extra y los colores, y regresa la marca GodsTap. Tu configuración se guarda y vuelve al renovar.
            </p>
          ))}
          {soon.map((x) => (
            <p key={x.tag.id} className="text-amber-300">
              <span className="font-semibold">{name(x)}</span>: tu plan {PLANS[x.st.plan].label} vence{" "}
              {x.st.daysLeft === 1 ? "mañana" : `en ${x.st.daysLeft} días`} ({formatDate(x.st.until)}).
            </p>
          ))}
        </div>
        <a
          href={whatsappLink(renewMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
        >
          Renovar por WhatsApp
        </a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Asistente de configuración rápida
   Pasos: 0 bienvenida | 1 nombre | 2 modo | 3 enlace | 4 listo
---------------------------------------------------------------- */
function SetupWizard({ tag, startStep = 0, onClose, onClaimAnother, onSaved, defaultName }) {
  const [step, setStep] = useState(startStep);
  const [name, setName] = useState(tag.business_name === DEFAULT_NAME ? defaultName || "" : tag.business_name || "");
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
      await logEvent({
        action: "tag_updated",
        owner_uid: tag.owner_uid || "",
        tag_id: tag.id,
        business_name: name.trim(),
        summary: "Terminó la configuración rápida.",
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
    <div className="fixed inset-0 z-50 flex overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative m-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 text-slate-500 transition hover:text-slate-50"
        >
          ✕
        </button>

        {showProgress && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-medium text-slate-500">
              Paso {step} de 3
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
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
            <h2 className="text-xl font-semibold text-slate-50">¡GT vinculado!</h2>
            <p className="mt-2 text-sm text-slate-400">
              <span className="font-mono text-slate-300">{tag.id}</span> ya es tuyo. Configúralo en
              menos de un minuto o hazlo después desde tu panel.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => setStep(1)}
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
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
                className="w-full px-4 py-2 text-sm text-slate-400 transition hover:text-slate-50"
              >
                Hacerlo más tarde
              </button>
            </div>
          </div>
        )}

        {/* 1. Nombre */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-50">¿Cómo se llama tu negocio?</h2>
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
            <h2 className="text-lg font-semibold text-slate-50">¿Qué pasa al escanear?</h2>
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
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-slate-700 bg-slate-950 hover:border-slate-600"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-50">{opt.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Enlace */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-50">
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
            <h2 className="text-xl font-semibold text-slate-50">¡Listo, {name.trim()}!</h2>
            <p className="mt-2 text-sm text-slate-400">
              Tu GT ya está configurado. Acércale tu celular para probarlo.
            </p>
            <div className="mt-6 space-y-3">
              <a
                href={`/t/${tag.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
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
                className="w-full px-4 py-2 text-sm text-slate-400 transition hover:text-slate-50"
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
              className="text-sm text-slate-400 transition hover:text-slate-50"
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
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
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
  const [profile, setProfile] = useState(null);  
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
      getDoc(doc(db, "users", u.uid))
        .then((snap) => setProfile(snap.exists() ? snap.data() : null))
        .catch(() => {});
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
      const alias = (claimForm.alias || "").trim().slice(0, 40);
      if (alias) {
        try {
          await updateDoc(doc(db, "tags", tagId), { nickname: alias, updated_at: serverTimestamp() });
        } catch (err) {
          console.error("No se pudo guardar el alias:", err);
        }
      }
      await logEvent({
        action: "tag_claimed",
        owner_uid: user.uid,
        tag_id: tagId,
        business_name: profile?.business_name || "",
        summary: `Vinculó el GT ${tagId}${alias ? ` con el alias «${alias}»` : ""}.`,
      });
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
          defaultName={profile?.business_name}          
          startStep={wizard.startStep}
          onClose={() => setWizard(null)}
          onClaimAnother={claimAnother}
          onSaved={() => loadTags(user.uid)}
        />
      )}

      {/* Encabezado */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">Mis GT</h1>
          <p className="mt-1 text-sm text-slate-400">Administra tus dispositivos NFC vinculados.</p>
        </div>
        <button
          onClick={() => {
            setShowClaim(!showClaim);
            setClaimError("");
          }}
          className="w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500"
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
            <h2 className="text-base font-semibold text-slate-50">Vincular un GT</h2>
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
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Alias (opcional)</label>
              <input
                value={claimForm.alias || ""}
                onChange={(e) => setClaimForm({ ...claimForm, alias: e.target.value })}
                maxLength={40}
                placeholder="Ej. Barra, Mesa 1, Cobro"
                className={inputClass}
              />
            </div>            
          </div>

          <button
            type="submit"
            disabled={claiming}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
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
          <LogoMark className="mb-5 h-14 w-14" />
          <h2 className="text-lg font-semibold text-slate-50">Aún no tienes GT vinculados</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Presiona «Vincular nuevo GT» e ingresa el ID y el código de activación que vienen con tu producto.
          </p>
        </div>
      )}
      
      {/* Aviso de vencimiento del plan */}
      {!loading && tags.length > 0 && <PlanNotice tags={tags} />}

      {/* Estadísticas */}
      {user && !loading && tags.length > 0 &&
        (tags.some((t) => tagIsPaid(t)) ? (
          <ScansPanel uid={user.uid} tags={tags.filter((t) => tagIsPaid(t))} />
        ) : (
          <section className="mb-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-50">
              <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v7a2 2 0 002 2h8a2 2 0 002-2V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clipRule="evenodd" />
              </svg>
              Escaneos
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Las estadísticas de escaneos están disponibles en el plan Pro.
            </p>
            <a
              href={whatsappLink("Hola, quiero el plan Pro de GodsTap")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-brand-400 hover:underline"
            >
              Pedir el plan Pro
            </a>
          </section>
        ))}
      {/* Tarjetas */}
      {!loading && tags.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => {
            const mode = modeStyle(tag.mode);
            const pending = needsSetup(tag);
            const plan = planStatus(tag);
            return (
              <article
                key={tag.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm shadow-black/5 transition hover:border-brand-500/40 hover:bg-slate-900"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-50">{tag.nickname || "GT sin nombre"}</p>
                    <p className="truncate font-mono text-xs text-slate-500">{tag.id}</p>
                  </div>
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

                <div className="flex items-center justify-between gap-3">
                  <h3 className="truncate text-base font-semibold text-slate-50">
                    {tag.business_name || "Sin nombre de negocio"}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                      plan.expired
                        ? "bg-red-500/10 text-red-300 ring-red-500/30"
                        : plan.paid
                        ? "bg-brand-500/10 text-brand-300 ring-brand-500/30"
                        : "bg-slate-500/10 text-slate-400 ring-slate-500/30"
                    }`}
                  >
                    {plan.expired ? `${PLANS[plan.plan].label} vencido` : PLANS[plan.plan].label}
                  </span>
                </div>

                <div className="mt-4 border-t border-slate-800 pt-4">
                  <p className="mb-1 text-xs font-medium text-slate-500">URL destino</p>
                  <p className="truncate text-sm text-brand-400" title={tag.target_url}>
                    {tag.target_url || "No configurada"}
                  </p>
                </div>

                {plan.until && (
                  <p className={`mt-3 text-xs ${plan.expired ? "text-red-300" : plan.expiringSoon ? "text-amber-300" : "text-slate-500"}`}>
                    {plan.expired ? "Venció" : "Vence"} el {formatDate(plan.until)}
                  </p>
                )}

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
                    className="text-slate-300 hover:text-slate-50 hover:underline"
                  >
                    Probar enlace
                  </a>
                  <button onClick={() => startEdit(tag)} className="text-slate-300 hover:text-slate-50 hover:underline">
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