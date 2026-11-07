"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import { PLANS, planOf, planStatus } from "@/lib/plans";
import { ADMIN_UID } from "@/lib/admin";
import { addLogToBatch } from "@/lib/audit";
import { BASE_URL, DEFAULT_NAME, applyPlan, revokeTag } from "@/lib/adminOps";
import { PlanBadge, PlanPicker } from "@/components/admin/PlanControls";
import TagEditor from "@/components/dashboard/TagEditor";
const ID_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
const NO_OWNER = "__sin_vincular__";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

function randomString(length, chars) {
  let out = "";
  const limit = 256 - (256 % chars.length);
  while (out.length < length) {
    const bytes = new Uint8Array(length * 2);
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b < limit && out.length < length) out += chars[b % chars.length];
    }
  }
  return out;
}

function downloadCsv(items) {
  const csv = "id,url,codigo\n" + items.map((i) => `${i.id},${i.url},${i.code}`).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `gt-lote-${Date.now()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [emails, setEmails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [qty, setQty] = useState(5);
  const [label, setLabel] = useState(DEFAULT_NAME);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState([]);

  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState("");
  const [revokeResult, setRevokeResult] = useState(null);
  const [editing, setEditing] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [tagsSnap, codesSnap] = await Promise.all([
        getDocs(collection(db, "tags")),
        getDocs(collection(db, "activation_codes")),
      ]);
      const codes = {};
      codesSnap.docs.forEach((d) => (codes[d.id] = d.data().code));
      setRows(
        tagsSnap.docs
          .map((d) => ({ id: d.id, ...d.data(), code: codes[d.id] || null }))
          .sort((a, b) => a.id.localeCompare(b.id))
      );

      // Correos de las cuentas (si falla, se muestra el UID)
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const map = {};
        usersSnap.docs.forEach((d) => (map[d.id] = d.data()));
        setEmails(map);
      } catch (err) {
        console.error("No se pudieron leer las cuentas:", err);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.code === "permission-denied"
          ? "Sin permiso. ¿Publicaste las reglas nuevas y el UID de admin es el correcto?"
          : "No se pudo cargar la lista."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return;
      // Quien no es administrador nunca ve esta pantalla: va directo a la página principal
      if (u.uid !== ADMIN_UID) {
        router.replace("/");
        return;
      }
      setUser(u);
      loadAll();
    });
    return () => unsub();
  }, [router]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    const n = Math.min(Math.max(parseInt(qty, 10) || 1, 1), 50);
    setCreating(true);
    try {
      const batch = writeBatch(db);
      const items = [];
      for (let i = 0; i < n; i++) {
        const id = "gt-" + randomString(8, ID_CHARS);
        const code = randomString(10, ID_CHARS.toUpperCase());
        batch.set(doc(db, "tags", id), {
          tag_id: id,
          plan: "basic",
          status: "unclaimed",
          business_name: label.trim() || DEFAULT_NAME,
          mode: "microsite",
          target_url: BASE_URL,
          created_at: serverTimestamp(),
        });
        batch.set(doc(db, "activation_codes", id), { code });
        items.push({ id, url: `${BASE_URL}/t/${id}`, code });
      }
      addLogToBatch(batch, {
        action: "tag_batch_created",
        business_name: label.trim() || DEFAULT_NAME,
        summary: `Creó ${n} GT (${items[0].id}${n > 1 ? ` … ${items[n - 1].id}` : ""}).`,
      });
      await batch.commit();
      setCreated(items);
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el lote. Revisa las reglas de Firestore.");
    } finally {
      setCreating(false);
    }
  };

  const setPlanFor = async (items, plan, months = 0) => {
    try {
      const newUntil = await applyPlan(items, plan, months);
      const ids = new Set(items.map((r) => r.id));
      setRows((rs) =>
        rs.map((r) => {
          if (!ids.has(r.id)) return r;
          const next = { ...r, plan };
          if (newUntil[r.id]) next.plan_until = newUntil[r.id];
          else delete next.plan_until;
          return next;
        })
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar el plan.");
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    setRevokeError("");
    const reason = revokeReason.trim();
    if (reason.length < 5) {
      setRevokeError("Escribe el motivo (mínimo 5 caracteres).");
      return;
    }
    setRevoking(true);
    try {
      const target = revokeTarget;
      const newCode = await revokeTag(target, reason);
      setRevokeResult({ id: target.id, code: newCode });
      setRevokeTarget(null);
      await loadAll();
    } catch (err) {
      console.error(err);
      setRevokeError("No se pudo revocar. Revisa que las reglas estén publicadas.");
    } finally {
      setRevoking(false);
    }
  };

  const handleDelete = async (row) => {
    if (!confirm(`¿Borrar ${row.id} definitivamente? No se puede deshacer.`)) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "tags", row.id));
      batch.delete(doc(db, "activation_codes", row.id));
      batch.delete(doc(db, "claims", row.id));
      addLogToBatch(batch, {
        action: "tag_deleted",
        owner_uid: row.owner_uid || "",
        tag_id: row.id,
        business_name: row.business_name || "",
        summary: `Borró el GT ${row.id}.`,
      });
      await batch.commit();
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("No se pudo borrar.");
    }
  };

  const copy = (text) => navigator.clipboard?.writeText(text);

  // Mientras se confirma la sesión (o se redirige a quien no es admin) no se muestra nada
  if (!user || user.uid !== ADMIN_UID) return null;

  // GT con plan vencido o a punto de vencer (primero los vencidos)
  const attention = rows
    .filter((r) => {
      const st = planStatus(r);
      return st.expired || st.expiringSoon;
    })
    .sort((x, y) => (planStatus(x).until ?? 0) - (planStatus(y).until ?? 0));

  // Búsqueda y agrupación por cuenta
  const q = search.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      !q ||
      [r.id, r.business_name, r.nickname, r.owner_uid, r.code, emails[r.owner_uid]?.email, emails[r.owner_uid]?.name, emails[r.owner_uid]?.business_name].some((v) =>
        String(v || "").toLowerCase().includes(q)
      )
  );

  const groupMap = {};
  visible.forEach((r) => {
    const key = r.owner_uid || NO_OWNER;
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(r);
  });

  const groups = Object.entries(groupMap)
    .map(([key, items]) => ({
      key,
      title:
        key === NO_OWNER
          ? "Sin vincular"
          : emails[key]?.business_name || emails[key]?.email || `Cuenta sin datos (${key.slice(0, 8)}…)`,
      subtitle:
        key === NO_OWNER ? "" : [emails[key]?.name, emails[key]?.email].filter(Boolean).join(" · "),
      items,
    }))
    .sort((a, b) => {
      if (a.key === NO_OWNER) return 1;
      if (b.key === NO_OWNER) return -1;
      return a.title.localeCompare(b.title);
    });

  const accountCount = groups.filter((g) => g.key !== NO_OWNER).length;

  return (
    <div>
      {/* Ventana: revocar */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleRevoke}
            className="m-auto w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-50">
                Revocar <span className="font-mono text-base text-slate-300">{revokeTarget.id}</span>
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                El cliente pierde el acceso, se genera un código nuevo y se borra la configuración del GT.
                Al entrar a su panel verá un aviso con el motivo.
              </p>
            </div>
            {revokeError && (
              <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {revokeError}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Motivo (lo verá el cliente)</label>
              <textarea
                autoFocus
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={4}
                maxLength={300}
                placeholder="Ej. Pago pendiente de la suscripción."
                className={inputClass}
              />
              <p className="mt-1 text-right text-xs text-slate-500">{revokeReason.length}/300</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={revoking}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {revoking ? "Revocando..." : "Revocar acceso"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <TagEditor admin tag={editing} onClose={() => setEditing(null)} onSaved={loadAll} />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-50">Administración de GT</h1>
        <p className="mt-1 text-sm text-slate-400">
          {rows.length} GT · {accountCount} cuentas con GT vinculados
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {revokeResult && (
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-50">
              Acceso revocado: <span className="font-mono">{revokeResult.id}</span>
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Código nuevo: <span className="font-mono text-amber-300">{revokeResult.code}</span>. El anterior ya no funciona.
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <button onClick={() => copy(revokeResult.code)} className="text-slate-300 hover:text-slate-50 hover:underline">
              Copiar código
            </button>
            <button onClick={() => setRevokeResult(null)} className="text-slate-500 hover:text-slate-50">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Crear lote */}
      <form onSubmit={handleCreate} className="mb-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-base font-semibold text-slate-50">Crear lote</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Cantidad (1 a 50)</label>
            <input type="number" min={1} max={50} value={qty} onChange={(e) => setQty(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre inicial</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
          </div>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-60"
        >
          {creating ? "Creando..." : "Crear GT"}
        </button>
      </form>

      {created.length > 0 && (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-50">Lote creado: {created.length} GT</h2>
              <p className="text-sm text-slate-400">Descarga el CSV para grabar los chips e imprimir los códigos.</p>
            </div>
            <button
              onClick={() => downloadCsv(created)}
              className="w-fit rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Descargar CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">URL para el chip</th>
                  <th className="py-2">Código</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs text-slate-300">
                {created.map((c) => (
                  <tr key={c.id} className="border-t border-slate-800">
                    <td className="py-2 pr-4">{c.id}</td>
                    <td className="py-2 pr-4">{c.url}</td>
                    <td className="py-2">{c.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cuentas */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por correo, nombre del GT, negocio, ID o código..."
          className={inputClass}
        />
        <button onClick={loadAll} className="shrink-0 text-sm text-slate-300 hover:text-slate-50 hover:underline">
          Actualizar
        </button>
      </div>

      {/* Planes por vencer o vencidos */}
      {!loading && attention.length > 0 && (
        <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="text-base font-semibold text-slate-50">
            Planes por vencer o vencidos ({attention.length})
          </h2>
          <ul className="mt-3 divide-y divide-amber-500/20 text-sm">
            {attention.map((r) => {
              const st = planStatus(r);
              const owner = emails[r.owner_uid];
              return (
                <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-50">
                      {owner?.business_name || r.business_name || r.id}
                      {r.nickname ? ` · ${r.nickname}` : ""}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {owner?.name ? `${owner.name} · ` : ""}
                      {owner?.email || r.owner_uid} · <span className="font-mono">{r.id}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <PlanBadge r={r} />
                    <button
                      onClick={() => setPlanFor([r], st.plan, 1)}
                      className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-500"
                    >
                      Renovar 1 mes
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {loading && <p className="text-sm text-slate-400">Cargando...</p>}
      {!loading && rows.length === 0 && <p className="text-sm text-slate-400">Aún no hay GT. Crea un lote arriba.</p>}
      {!loading && rows.length > 0 && groups.length === 0 && <p className="text-sm text-slate-400">Sin resultados.</p>}

      <div className="space-y-4">
        {groups.map((g) => {
          const linked = g.key !== NO_OWNER;
          const proCount = g.items.filter((r) => planStatus(r).paid).length;
          return (
            <details key={g.key} open={!!q || g.items.length <= 5} className="rounded-2xl border border-slate-800 bg-slate-900/60">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-5 py-4">
                <span>
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-50"><span className={`h-2 w-2 rounded-full ${linked ? "bg-emerald-500" : "bg-slate-500"}`} aria-hidden="true" />{g.title}</span>
                  {g.subtitle && <span className="block text-xs text-slate-500">{g.subtitle}</span>}
                </span>
                <span className="text-xs text-slate-400">
                  {g.items.length} GT{linked ? ` · ${proCount} de pago` : ""}
                  {linked && (
                    <Link
                      href={`/dashboard/admin/cuenta/${g.key}`}
                      onClick={(e) => e.stopPropagation()}
                      className="ml-3 font-medium text-brand-400 hover:underline"
                    >
                      Ver cuenta
                    </Link>
                  )}
                </span>
              </summary>

              <div className="border-t border-slate-800 px-5 pb-5 pt-3">
                {linked && (
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>Cambiar el plan de todos sus GT:</span>
                    <PlanPicker
                      initialPlan="pro"
                      confirmText={(plan, months) =>
                        `¿Poner ${g.items.length} GT de ${g.title} en plan ${PLANS[plan].label}${months ? ` por ${months} ${months === 1 ? "mes" : "meses"}` : ""}?`
                      }
                      onApply={(plan, months) => setPlanFor(g.items, plan, months)}
                    />
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-slate-500">
                      <tr>
                        <th className="py-2 pr-4">GT</th>
                        <th className="py-2 pr-4">Negocio</th>
                        <th className="py-2 pr-4">Plan</th>
                        <th className="py-2 pr-4">Código</th>
                        <th className="py-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {g.items.map((r) => (
                        <tr key={r.id} className="border-t border-slate-800">
                          <td className="py-2 pr-4">
                            <p className="font-medium text-slate-50">{r.nickname || "—"}</p>
                            <p className="font-mono text-xs text-slate-500">{r.id}</p>
                          </td>
                          <td className="max-w-[180px] truncate py-2 pr-4">{r.business_name || "—"}</td>
                          <td className="py-2 pr-4">
                            <div className="space-y-1.5">
                              <PlanBadge r={r} />
                              <PlanPicker initialPlan={planOf(r.plan)} onApply={(plan, months) => setPlanFor([r], plan, months)} />
                            </div>
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs">{r.code || "—"}</td>
                          <td className="space-x-3 whitespace-nowrap py-2 text-xs">
                            <button onClick={() => setEditing(r)} className="font-medium text-brand-400 hover:underline">
                              Editar
                            </button>
                            <button onClick={() => copy(`${BASE_URL}/t/${r.id}`)} className="hover:text-slate-50 hover:underline">
                              Copiar URL
                            </button>
                            {r.owner_uid && (
                              <button
                                onClick={() => {
                                  setRevokeTarget(r);
                                  setRevokeReason("");
                                  setRevokeError("");
                                }}
                                className="text-amber-300 hover:underline"
                              >
                                Revocar
                              </button>
                            )}
                            <button onClick={() => handleDelete(r)} className="text-red-400 hover:underline">
                              Borrar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}