"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import useAdminGuard from "@/components/admin/useAdminGuard";
import { PlanBadge, PlanPicker } from "@/components/admin/PlanControls";
import TagEditor from "@/components/dashboard/TagEditor";
import {
  BASE_URL,
  DEFAULT_NAME,
  applyPlan,
  assignTag,
  deleteAccount,
  revokeTag,
  sendResetEmail,
  setSuspended,
  updateProfile,
} from "@/lib/adminOps";
import { ACTION_LABELS, formatDateTime, tsMs } from "@/lib/audit";
import { formatDate } from "@/lib/plans";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

const btnPrimary =
  "rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60";
const btnGhost =
  "rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60";

function AccountDetail() {
  const admin = useAdminGuard();
  const params = useParams();
  const uid = Array.isArray(params?.uid) ? params.uid[0] : params?.uid;

  const [profile, setProfile] = useState(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [tags, setTags] = useState([]);
  const [freeTags, setFreeTags] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsError, setLogsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const [form, setForm] = useState({ name: "", business: "" });
  const [editing, setEditing] = useState(null);
  const [assignId, setAssignId] = useState("");
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeError, setRevokeError] = useState("");

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setError("");
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setProfileMissing(false);
        setForm({ name: data.name || "", business: data.business_name || "" });
      } else {
        setProfile(null);
        setProfileMissing(true);
      }

      const tagsSnap = await getDocs(query(collection(db, "tags"), where("owner_uid", "==", uid)));
      setTags(tagsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.id.localeCompare(b.id)));

      const freeSnap = await getDocs(query(collection(db, "tags"), where("status", "==", "unclaimed")));
      setFreeTags(freeSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((t) => !t.owner_uid).sort((a, b) => a.id.localeCompare(b.id)));
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la cuenta. Revisa que las reglas de Firestore estén publicadas.");
    }

    try {
      const logsSnap = await getDocs(query(collection(db, "audit_logs"), where("owner_uid", "==", uid)));
      const list = logsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => tsMs(b.at) - tsMs(a.at));
      setLogs(list.slice(0, 100));
      setLogsError(false);
    } catch (err) {
      console.error(err);
      setLogsError(true);
    }
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  // Ejecuta una acción mostrando un mensaje de éxito o de error
  const run = async (key, fn, okMessage) => {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await fn();
      if (okMessage) setNotice(okMessage);
      await load();
    } catch (err) {
      console.error(err);
      setError("No se pudo completar la acción. Revisa que las reglas de Firestore estén publicadas.");
    } finally {
      setBusy("");
    }
  };

  const saveProfile = (e) => {
    e.preventDefault();
    const name = form.name.trim().slice(0, 60);
    const business = form.business.trim().slice(0, 80);
    if (!name || !business) {
      setError("Escribe el nombre y el negocio.");
      return;
    }
    run("profile", () => updateProfile(uid, profile, { name, business_name: business }), "Perfil guardado.");
  };

  const toggleSuspend = () => {
    const suspend = !profile?.suspended;
    if (suspend && !confirm("¿Suspender esta cuenta? No podrá usar su panel, pero sus GT siguen funcionando.")) return;
    run("suspend", () => setSuspended(uid, profile, suspend), suspend ? "Cuenta suspendida." : "Cuenta reactivada.");
  };

  const removeAccount = () => {
    const msg = `¿Eliminar la cuenta de ${profile?.business_name || profile?.email || uid}?\n\nSus ${tags.length} GT quedarán sin dueño, con un código de activación nuevo, y la cuenta quedará bloqueada. Esto no se puede deshacer.`;
    if (!confirm(msg)) return;
    run("delete", () => deleteAccount(uid, profile, tags), "Cuenta eliminada. Sus GT quedaron libres.");
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    const reason = revokeReason.trim();
    if (reason.length < 5) {
      setRevokeError("Escribe el motivo (mínimo 5 caracteres).");
      return;
    }
    const target = revokeTarget;
    setRevokeTarget(null);
    setRevokeReason("");
    setRevokeError("");
    let code = "";
    await run("revoke", async () => {
      code = await revokeTag(target, reason);
    });
    if (code) setNotice(`GT ${target.id} revocado. Nuevo código de activación: ${code}`);
  };

  if (!admin) return null;

  const title = profile?.business_name || profile?.email || uid;
  const suspended = !!profile?.suspended;
  const deleted = !!profile?.deleted_at;

  return (
    <div>
      {editing && <TagEditor admin tag={editing} onClose={() => setEditing(null)} onSaved={load} />}

      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={handleRevoke} className="m-auto w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-50">Revocar {revokeTarget.id}</h2>
            <p className="text-sm text-slate-400">
              El GT queda sin dueño, con un código nuevo, y el cliente verá un aviso con este motivo.
            </p>
            {revokeError && <p className="text-sm text-red-300">{revokeError}</p>}
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Motivo"
              className={inputClass}
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setRevokeTarget(null)} className={btnGhost}>
                Cancelar
              </button>
              <button type="submit" className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500">
                Revocar
              </button>
            </div>
          </form>
        </div>
      )}

      <Link href="/dashboard/admin/cuentas" className="text-sm text-slate-400 hover:text-slate-50">
        ← Cuentas
      </Link>

      <div className="mb-8 mt-3 flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">{title}</h1>
        {deleted ? (
          <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-300 ring-1 ring-red-500/30">Eliminada</span>
        ) : suspended ? (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">Suspendida</span>
        ) : null}
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <span className="break-words">{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Cerrar aviso" className="shrink-0 text-emerald-300/70 hover:text-emerald-300">
            ✕
          </button>
        </div>
      )}
      {loading && <p className="mb-6 text-sm text-slate-400">Cargando...</p>}

      {/* Perfil */}
      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <h2 className="text-base font-semibold text-slate-50">Perfil</h2>
        {profileMissing ? (
          <p className="mt-2 text-sm text-slate-400">
            Esta cuenta aún no tiene perfil guardado (puede que nunca haya entrado a su panel). Sus GT sí se muestran abajo.
          </p>
        ) : (
          <>
            <p className="mt-1 break-all text-sm text-slate-400">
              {profile?.email || "Sin correo"} · <span className="font-mono text-xs">{uid}</span>
              {profile?.created_at && <> · Alta: {formatDate(tsMs(profile.created_at))}</>}
            </p>
            <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="p-name" className="mb-1.5 block text-sm font-medium text-slate-300">Nombre de la persona</label>
                <input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} className={inputClass} />
              </div>
              <div>
                <label htmlFor="p-business" className="mb-1.5 block text-sm font-medium text-slate-300">Nombre del negocio</label>
                <input id="p-business" value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} maxLength={80} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={busy === "profile"} className={`${btnPrimary} w-full sm:w-auto`}>
                  {busy === "profile" ? "Guardando..." : "Guardar perfil"}
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:flex-wrap [&>button]:w-full sm:[&>button]:w-auto">
              <button
                disabled={!profile?.email || busy === "reset"}
                onClick={() => run("reset", () => sendResetEmail(uid, profile), `Se envió el correo para cambiar contraseña a ${profile.email}.`)}
                className={btnGhost}
              >
                Enviar correo para cambiar contraseña
              </button>
              <button disabled={busy === "suspend"} onClick={toggleSuspend} className={btnGhost}>
                {suspended ? "Reactivar cuenta" : "Suspender cuenta"}
              </button>
              <button
                disabled={busy === "delete" || deleted}
                onClick={removeAccount}
                className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Eliminar cuenta
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Eliminar libera sus GT y bloquea el panel. El acceso de Firebase Authentication no se puede borrar desde aquí; si quieres quitarlo del todo, hazlo en la consola de Firebase.
            </p>
          </>
        )}
      </section>

      {/* GT de la cuenta */}
      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <h2 className="text-base font-semibold text-slate-50">GT de esta cuenta ({tags.length})</h2>

        {tags.length === 0 && !loading && <p className="mt-3 text-sm text-slate-400">Esta cuenta no tiene GT vinculados.</p>}

        <div className="mt-4 space-y-4">
          {tags.map((t) => (
            <article key={t.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-50">{t.nickname || t.business_name || "GT sin nombre"}</p>
                  <p className="truncate text-xs text-slate-500">
                    <span className="font-mono">{t.id}</span> · {t.business_name || DEFAULT_NAME} · {t.mode === "redirect" ? "Redirección" : "Micrositio"}
                  </p>
                  <p className="mt-1 max-w-md truncate text-xs text-slate-400" title={t.target_url}>{t.target_url}</p>
                </div>
                <div className="space-y-1.5">
                  <PlanBadge r={t} />
                  <PlanPicker
                    initialPlan={t.plan || "basic"}
                    onApply={(plan, months) => run("plan-" + t.id, () => applyPlan([t], plan, months), "Plan actualizado.")}
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:flex sm:flex-wrap sm:gap-4 [&>*]:rounded-lg [&>*]:border [&>*]:border-slate-700 [&>*]:px-3 [&>*]:py-2.5 [&>*]:text-center sm:[&>*]:border-0 sm:[&>*]:p-0">
                <button onClick={() => setEditing(t)} className="col-span-2 font-medium text-brand-300 hover:underline sm:col-span-1 sm:!text-brand-400">Editar configuración</button>
                <a href={`/t/${t.id}`} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-slate-50 hover:underline">Ver página</a>
                <button onClick={() => navigator.clipboard?.writeText(`${BASE_URL}/t/${t.id}`)} className="text-slate-300 hover:text-slate-50 hover:underline">Copiar URL</button>
                <button
                  onClick={() => {
                    setRevokeTarget(t);
                    setRevokeReason("");
                    setRevokeError("");
                  }}
                  className="text-amber-300 hover:underline"
                >
                  Revocar
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Asignar un GT libre */}
        {!profileMissing && !deleted && (
          <div className="mt-6 border-t border-slate-800 pt-5">
            <p className="mb-2 text-sm font-medium text-slate-300">Asignar un GT sin dueño a esta cuenta</p>
            {freeTags.length === 0 ? (
              <p className="text-sm text-slate-500">No hay GT libres. Crea un lote en la pestaña GT.</p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <select value={assignId} onChange={(e) => setAssignId(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50">
                  <option value="">Elegir GT...</option>
                  {freeTags.map((t) => (
                    <option key={t.id} value={t.id}>{t.id}</option>
                  ))}
                </select>
                <button
                  disabled={!assignId || busy === "assign"}
                  onClick={() => {
                    const tag = freeTags.find((t) => t.id === assignId);
                    if (!tag) return;
                    setAssignId("");
                    run("assign", () => assignTag(tag, uid, profile?.business_name || profile?.email), `GT ${tag.id} asignado.`);
                  }}
                  className={`${btnPrimary} w-full sm:w-auto`}
                >
                  Asignar
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Registro */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        <h2 className="text-base font-semibold text-slate-50">Movimientos de esta cuenta</h2>
        {logsError && (
          <p className="mt-3 text-sm text-amber-300">
            No se pudo leer el registro. Publica las reglas nuevas de Firestore (incluyen la colección audit_logs).
          </p>
        )}
        {!logsError && logs.length === 0 && <p className="mt-3 text-sm text-slate-400">Aún no hay movimientos registrados.</p>}
        {logs.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-800 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-50">{ACTION_LABELS[l.action] || l.action}</span>
                  <span className="text-xs text-slate-500">{formatDateTime(tsMs(l.at))}</span>
                </div>
                <p className="mt-0.5 text-slate-400">{l.summary}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {l.actor_role === "admin" ? "Admin" : "Cliente"} · {l.actor_email || l.actor_uid}
                  {l.tag_id ? ` · ${l.tag_id}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AccountDetailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Cargando...</p>}>
      <AccountDetail />
    </Suspense>
  );
}
