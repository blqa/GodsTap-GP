"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteField,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

const ADMIN_UID = "XpdTgI0PrEP05Ilabz32KxpWba42";
const BASE_URL = "https://godstap.godsplan.site";
const ID_CHARS = "abcdefghjkmnpqrstuvwxyz23456789"; // sin letras que se confunden (i, l, o, 0, 1)

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30";

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
  const csv =
    "id,url,codigo\n" + items.map((i) => `${i.id},${i.url},${i.code}`).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `gt-lote-${Date.now()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [qty, setQty] = useState(5);
  const [label, setLabel] = useState("GT sin activar");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState([]);

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
      const list = tagsSnap.docs
        .map((d) => ({ id: d.id, ...d.data(), code: codes[d.id] || null }))
        .sort((a, b) => a.id.localeCompare(b.id));
      setRows(list);
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
      if (!u) return; // El layout redirige a /login
      setUser(u);
      if (u.uid === ADMIN_UID) loadAll();
      else setLoading(false);
    });
    return () => unsub();
  }, []);

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
          status: "unclaimed",
          business_name: label.trim() || "GT sin activar",
          mode: "microsite",
          target_url: BASE_URL,
          created_at: serverTimestamp(),
        });
        batch.set(doc(db, "activation_codes", id), { code });
        items.push({ id, url: `${BASE_URL}/t/${id}`, code });
      }
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

  const handleReset = async (row) => {
    if (!confirm(`¿Resetear ${row.id}? Quedará sin dueño y con el mismo código.`)) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "tags", row.id), {
        owner_uid: deleteField(),
        status: "unclaimed",
        claimed_at: deleteField(),
      });
      batch.delete(doc(db, "claims", row.id));
      await batch.commit();
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("No se pudo resetear.");
    }
  };

  const handleDelete = async (row) => {
    if (!confirm(`¿Borrar ${row.id} definitivamente? No se puede deshacer.`)) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "tags", row.id));
      batch.delete(doc(db, "activation_codes", row.id));
      batch.delete(doc(db, "claims", row.id));
      await batch.commit();
      await loadAll();
    } catch (err) {
      console.error(err);
      setError("No se pudo borrar.");
    }
  };

  const copy = (text) => navigator.clipboard?.writeText(text);

  if (user && user.uid !== ADMIN_UID) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <h1 className="text-lg font-semibold text-white">Sin acceso</h1>
        <p className="mt-2 text-sm text-slate-400">Esta sección es solo para administradores.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Administración de GT</h1>
        <p className="mt-1 text-sm text-slate-400">
          Crea lotes de GT sin dueño, con ID y código de activación aleatorios.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Crear lote */}
      <form
        onSubmit={handleCreate}
        className="mb-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
      >
        <h2 className="text-base font-semibold text-white">Crear lote</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Cantidad (1 a 50)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre inicial</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
          </div>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? "Creando..." : "Crear GT"}
        </button>
      </form>

      {/* Resultado del último lote */}
      {created.length > 0 && (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Lote creado: {created.length} GT</h2>
              <p className="text-sm text-slate-400">
                Descarga el CSV ahora: sirve para grabar los chips e imprimir los códigos.
              </p>
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
              <thead className="text-xs uppercase tracking-wider text-slate-500">
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

      {/* Todos los GT */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Todos los GT ({rows.length})</h2>
          <button onClick={loadAll} className="text-sm text-slate-300 hover:text-white hover:underline">
            Actualizar
          </button>
        </div>

        {loading && <p className="text-sm text-slate-400">Cargando...</p>}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-slate-400">Aún no hay GT. Crea un lote arriba.</p>
        )}

        {!loading && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Negocio</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-800">
                    <td className="py-2 pr-4 font-mono text-xs">{r.id}</td>
                    <td className="max-w-[180px] truncate py-2 pr-4">{r.business_name || "—"}</td>
                    <td className="py-2 pr-4">
                      {r.owner_uid ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300 ring-1 ring-emerald-500/30">
                          Vinculado ({r.owner_uid.slice(0, 5)}…)
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300 ring-1 ring-amber-500/30">
                          Sin vincular
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{r.code || "—"}</td>
                    <td className="space-x-3 whitespace-nowrap py-2 text-xs">
                      <button onClick={() => copy(`${BASE_URL}/t/${r.id}`)} className="hover:text-white hover:underline">
                        Copiar URL
                      </button>
                      {r.owner_uid && (
                        <button onClick={() => handleReset(r)} className="text-amber-300 hover:underline">
                          Resetear
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
        )}
      </div>
    </div>
  );
}