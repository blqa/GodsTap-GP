"use client";

import { Fragment, useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { dayKey } from "@/lib/scans";

const DAY_MS = 86400000;

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

function Spark({ values }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-8 items-end gap-0.5" aria-hidden="true">
      {values.map((v, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-sm ${v > 0 ? "bg-brand-400" : "bg-slate-800"}`}
          style={{ height: `${Math.max(2, (v / max) * 32)}px` }}
        />
      ))}
    </div>
  );
}

export default function ScansPanel({ uid, tags }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(query(collection(db, "scan_days"), where("owner_uid", "==", uid)));

      // Últimos 30 días (el más viejo primero)
      const days = [];
      for (let i = 29; i >= 0; i--) days.push(dayKey(new Date(Date.now() - i * DAY_MS)));
      const recent = new Set(days);

      const byTag = {};
      const clicksByTag = {}; // clics por botón en los últimos 30 días
      snap.docs.forEach((d) => {
        const { tag_id, day, count, clicks } = d.data();
        if (!byTag[tag_id]) byTag[tag_id] = {};
        byTag[tag_id][day] = Number(count) || 0;
        if (clicks && typeof clicks === "object" && recent.has(day)) {
          if (!clicksByTag[tag_id]) clicksByTag[tag_id] = {};
          Object.entries(clicks).forEach(([label, n]) => {
            clicksByTag[tag_id][label] = (clicksByTag[tag_id][label] || 0) + (Number(n) || 0);
          });
        }
      });

      setStats({ byTag, clicksByTag, days });
    } catch (err) {
      console.error(err);
      setError(
        err.code === "permission-denied"
          ? "Sin permiso para leer las estadísticas. ¿Publicaste las reglas nuevas?"
          : "No se pudieron cargar las estadísticas."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [uid]);

  const rows = stats
    ? tags.map((tag) => {
        const perDay = stats.byTag[tag.id] || {};
        const series = stats.days.map((d) => perDay[d] || 0);
        return {
          tag,
          today: series[series.length - 1],
          week: sum(series.slice(-7)),
          month: sum(series),
          total: sum(Object.values(perDay)),
          spark: series.slice(-14),
          clicks: Object.entries(stats.clicksByTag[tag.id] || {})
            .filter(([, n]) => n > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8),
        };
      })
    : [];

  const totalWeek = sum(rows.map((r) => r.week));

  return (
    <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-50">Escaneos y clics</h2>
          <p className="text-xs text-slate-500">
            {stats ? `${totalWeek} en los últimos 7 días. ` : ""}Hora de Ciudad de México.
          </p>
        </div>
        <button onClick={load} className="text-sm text-slate-300 hover:text-slate-50 hover:underline">
          Actualizar
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && !stats && <p className="text-sm text-slate-400">Cargando...</p>}

      {stats && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-2 pr-4">GT</th>
                <th className="py-2 pr-4 text-right">Hoy</th>
                <th className="py-2 pr-4 text-right">7 días</th>
                <th className="py-2 pr-4 text-right">30 días</th>
                <th className="py-2 pr-4 text-right">Total</th>
                <th className="py-2">Últimos 14 días</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {rows.map((r) => (
                <Fragment key={r.tag.id}>
                <tr className="border-t border-slate-800">
                  <td className="max-w-[200px] py-3 pr-4">
                    <p className="truncate font-medium text-slate-50">{r.tag.business_name || "Sin nombre"}</p>
                    <p className="font-mono text-xs text-slate-500">{r.tag.id}</p>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">{r.today}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{r.week}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{r.month}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{r.total}</td>
                  <td className="py-3">
                    <Spark values={r.spark} />
                  </td>
                </tr>
                <tr>
                  <td colSpan={6} className="pb-4">
                    <p className="mb-1.5 text-xs text-slate-500">Botones más tocados (últimos 30 días)</p>
                    {r.clicks.length ? (
                      <ul className="flex flex-wrap gap-2">
                        {r.clicks.map(([label, n]) => (
                          <li key={label} className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 py-1 pl-3 pr-1.5 text-xs text-slate-200">
                            <span className="max-w-[12rem] truncate">{label}</span>
                            <span className="rounded-full bg-brand-600/25 px-2 py-0.5 font-semibold tabular-nums text-slate-50">{n}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-600">Todavía nadie ha tocado un botón.</p>
                    )}
                  </td>
                </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}