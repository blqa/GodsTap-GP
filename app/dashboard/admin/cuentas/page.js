"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import useAdminGuard from "@/components/admin/useAdminGuard";
import { BASE_URL, createAuthUser, createProfile, randomPassword } from "@/lib/adminOps";
import { formatDate } from "@/lib/plans";
import { tsMs } from "@/lib/audit";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

const AUTH_ERRORS = {
  "auth/email-already-in-use": "Ya existe un acceso con ese correo.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/weak-password": "La contraseña es muy débil (mínimo 8 caracteres).",
  "auth/network-request-failed": "Error de red. Revisa tu conexión.",
};

function StatusBadge({ profile }) {
  if (profile.deleted_at) {
    return <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300 ring-1 ring-red-500/30">Eliminada</span>;
  }
  if (profile.suspended) {
    return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">Suspendida</span>;
  }
  return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">Activa</span>;
}

export default function AccountsPage() {
  const admin = useAdminGuard();
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", business: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdInfo, setCreatedInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [usersSnap, tagsSnap] = await Promise.all([getDocs(collection(db, "users")), getDocs(collection(db, "tags"))]);
      setUsers(usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() })));
      setTags(tagsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las cuentas. Revisa que las reglas de Firestore estén publicadas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    const name = form.name.trim().slice(0, 60);
    const business = form.business.trim().slice(0, 80);
    const email = form.email.trim().toLowerCase();
    if (!name || !business) return setCreateError("Escribe el nombre y el negocio.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setCreateError("El correo no es válido.");
    if (form.password.length < 8) return setCreateError("La contraseña debe tener al menos 8 caracteres.");

    setCreating(true);
    try {
      const uid = await createAuthUser(email, form.password);
      try {
        await createProfile(uid, { email, name, business_name: business });
      } catch (err) {
        console.error(err);
        setCreateError("Se creó el acceso, pero no se pudo guardar el perfil. Revisa las reglas de Firestore y avísame.");
        setCreating(false);
        return;
      }
      setCreatedInfo({ uid, email, password: form.password, name });
      setForm({ name: "", business: "", email: "", password: "" });
      setShowForm(false);
      await load();
    } catch (err) {
      console.error(err);
      setCreateError(AUTH_ERRORS[err.code] || "No se pudo crear la cuenta.");
    } finally {
      setCreating(false);
    }
  };

  const message = createdInfo
    ? `Hola ${createdInfo.name}, tu cuenta de GodsTap está lista.\nEntra en ${BASE_URL}/login\nCorreo: ${createdInfo.email}\nContraseña temporal: ${createdInfo.password}\nCámbiala cuando quieras con "¿Olvidaste tu contraseña?".`
    : "";

  if (!admin) return null;

  const gtCount = {};
  tags.forEach((t) => {
    if (!t.owner_uid) return;
    gtCount[t.owner_uid] = (gtCount[t.owner_uid] || 0) + 1;
  });

  const q = search.trim().toLowerCase();
  const visible = users
    .filter((u) => !q || [u.name, u.business_name, u.email, u.uid].some((v) => String(v || "").toLowerCase().includes(q)))
    .sort((a, b) => String(a.business_name || a.email || "").localeCompare(String(b.business_name || b.email || "")));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">Cuentas</h1>
          <p className="mt-1 text-sm text-slate-400">{users.length} cuentas registradas</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setCreateError("");
            if (!showForm) setForm((f) => ({ ...f, password: f.password || randomPassword() }));
          }}
          className="w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
        >
          {showForm ? "Cerrar" : "+ Nueva cuenta"}
        </button>
      </div>

      {createdInfo && (
        <section className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm">
          <h2 className="text-base font-semibold text-slate-50">Cuenta creada</h2>
          <p className="mt-1 text-slate-300">
            Entrega estos datos a tu cliente. La contraseña no se vuelve a mostrar.
          </p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs text-slate-200">{message}</pre>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(message);
                setCopied(true);
              }}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500"
            >
              {copied ? "Copiado" : "Copiar mensaje"}
            </button>
            <Link href={`/dashboard/admin/cuenta/${createdInfo.uid}`} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800">
              Abrir la cuenta
            </Link>
            <button
              onClick={() => {
                setCreatedInfo(null);
                setCopied(false);
              }}
              className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-50"
            >
              Ocultar
            </button>
          </div>
        </section>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-semibold text-slate-50">Nueva cuenta</h2>
          {createError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {createError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="n-name" className="mb-1.5 block text-sm font-medium text-slate-300">Nombre de la persona</label>
              <input id="n-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} required className={inputClass} />
            </div>
            <div>
              <label htmlFor="n-business" className="mb-1.5 block text-sm font-medium text-slate-300">Nombre del negocio</label>
              <input id="n-business" value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} maxLength={80} required className={inputClass} />
            </div>
            <div>
              <label htmlFor="n-email" className="mb-1.5 block text-sm font-medium text-slate-300">Correo</label>
              <input id="n-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputClass} />
            </div>
            <div>
              <label htmlFor="n-pass" className="mb-1.5 block text-sm font-medium text-slate-300">Contraseña temporal</label>
              <div className="flex gap-2">
                <input id="n-pass" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className={`${inputClass} font-mono`} />
                <button type="button" onClick={() => setForm({ ...form, password: randomPassword() })} className="shrink-0 rounded-lg border border-slate-700 px-3 text-sm text-slate-200 hover:bg-slate-800">
                  Generar
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
      )}

      <div className="mb-4 flex gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, negocio o correo" className={inputClass} />
        <button onClick={load} className="shrink-0 text-sm text-slate-300 hover:text-slate-50 hover:underline">
          Actualizar
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {loading && <p className="text-sm text-slate-400">Cargando...</p>}
      {!loading && visible.length === 0 && <p className="text-sm text-slate-400">No hay cuentas que mostrar.</p>}

      {visible.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3">Negocio</th>
                <th className="px-3 py-3">Persona</th>
                <th className="px-3 py-3">Correo</th>
                <th className="px-3 py-3">GT</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Alta</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {visible.map((u) => (
                <tr key={u.uid} className="border-t border-slate-800">
                  <td className="max-w-[200px] truncate px-5 py-3 font-medium text-slate-50">{u.business_name || "—"}</td>
                  <td className="max-w-[160px] truncate px-3 py-3">{u.name || "—"}</td>
                  <td className="max-w-[220px] truncate px-3 py-3">{u.email || "—"}</td>
                  <td className="px-3 py-3">{gtCount[u.uid] || 0}</td>
                  <td className="px-3 py-3"><StatusBadge profile={u} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{u.created_at ? formatDate(tsMs(u.created_at)) : "—"}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <Link href={`/dashboard/admin/cuenta/${u.uid}`} className="font-medium text-brand-400 hover:underline">
                      Ver y editar
                    </Link>
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
