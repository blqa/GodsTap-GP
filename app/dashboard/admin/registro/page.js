"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import useAdminGuard from "@/components/admin/useAdminGuard";
import { ACTION_LABELS, formatDateTime, tsMs } from "@/lib/audit";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

const PAGE = 300;

export default function LogPage() {
  const admin = useAdminGuard();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [role, setRole] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(query(collection(db, "audit_logs"), orderBy("at", "desc"), limit(PAGE)));
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      setError("No se pudo leer el registro. Publica las reglas nuevas de Firestore (incluyen la colección audit_logs).");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  if (!admin) return null;

  const q = search.trim().toLowerCase();
  const visible = logs.filter((l) => {
    if (action && l.action !== action) return false;
    if (role && l.actor_role !== role) return false;
    if (!q) return true;
    return [l.business_name, l.summary, l.actor_email, l.tag_id, l.owner_uid, ACTION_LABELS[l.action]].some((v) =>
      String(v || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">Registro de movimientos</h1>
          <p className="mt-1 text-sm text-slate-400">
            Lo que hacen tus clientes y lo que haces tú. Se muestran los últimos {PAGE}. Los registros no se pueden editar ni borrar.
          </p>
        </div>
        <button onClick={load} className="shrink-0 text-sm text-slate-300 hover:text-slate-50 hover:underline">
          Actualizar
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por negocio, correo, GT o texto" className={inputClass} />
        <select value={action} onChange={(e) => setAction(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-50 sm:py-2" aria-label="Tipo de movimiento">
          <option value="">Todos los movimientos</option>
          {Object.entries(ACTION_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-50 sm:py-2" aria-label="Quién lo hizo">
          <option value="">Admin y clientes</option>
          <option value="admin">Solo admin</option>
          <option value="cliente">Solo clientes</option>
        </select>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {loading && <p className="text-sm text-slate-400">Cargando...</p>}
      {!loading && !error && visible.length === 0 && <p className="text-sm text-slate-400">No hay movimientos que mostrar.</p>}

      {visible.length > 0 && (
        <ul className="space-y-3 md:hidden">
          {visible.map((l) => (
            <li key={l.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-slate-50">{ACTION_LABELS[l.action] || l.action}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ring-1 ${l.actor_role === "admin" ? "bg-brand-500/10 text-brand-300 ring-brand-500/30" : "bg-slate-500/10 text-slate-400 ring-slate-500/30"}`}>
                  {l.actor_role === "admin" ? "Admin" : "Cliente"}
                </span>
              </div>
              <p className="mt-1 break-words text-slate-400">{l.summary}</p>
              <p className="mt-2 text-xs text-slate-500">
                {formatDateTime(tsMs(l.at))}
                {l.tag_id ? <> · <span className="font-mono">{l.tag_id}</span></> : null}
              </p>
              <p className="mt-0.5 break-all text-xs text-slate-500">{l.actor_email || l.actor_uid}</p>
              {l.owner_uid && (
                <Link href={`/dashboard/admin/cuenta/${l.owner_uid}`} className="mt-2 inline-block text-xs font-medium text-brand-400">
                  {l.business_name || "Ver cuenta"} →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      {visible.length > 0 && (
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 md:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-3 py-3">Negocio</th>
                <th className="px-3 py-3">Movimiento</th>
                <th className="px-3 py-3">Detalle</th>
                <th className="px-5 py-3">Quién</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {visible.map((l) => (
                <tr key={l.id} className="border-t border-slate-800 align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">{formatDateTime(tsMs(l.at))}</td>
                  <td className="max-w-[180px] px-3 py-3">
                    {l.owner_uid ? (
                      <Link href={`/dashboard/admin/cuenta/${l.owner_uid}`} className="font-medium text-brand-400 hover:underline">
                        {l.business_name || "Ver cuenta"}
                      </Link>
                    ) : (
                      <span>{l.business_name || "—"}</span>
                    )}
                    {l.tag_id && <p className="font-mono text-xs text-slate-500">{l.tag_id}</p>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-50">{ACTION_LABELS[l.action] || l.action}</td>
                  <td className="min-w-[220px] px-3 py-3 text-slate-400">{l.summary}</td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-xs">
                    <span className={l.actor_role === "admin" ? "text-brand-400" : "text-slate-400"}>
                      {l.actor_role === "admin" ? "Admin" : "Cliente"}
                    </span>
                    <span className="block truncate text-slate-500">{l.actor_email || l.actor_uid}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
