"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import AuthShell from "@/components/AuthShell";

const ERRORES = {
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/weak-password": "La contraseña es muy débil.",
  "auth/network-request-failed": "Error de red. Revisa tu conexión.",
};

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !business.trim()) {
      setError("Escribe tu nombre y el nombre de tu negocio.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

      try {
        await setDoc(
          doc(db, "users", cred.user.uid),
          {
            email: cred.user.email,
            name: name.trim().slice(0, 60),
            business_name: business.trim().slice(0, 80),
            created_at: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("No se pudo crear el perfil:", err);
      }

      router.push("/dashboard");
    } catch (err) {
      setError(ERRORES[err.code] || "No se pudo crear la cuenta. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Regístrate para vincular y administrar tus GT."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-brand-400 hover:text-brand-300">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">Tu nombre</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required placeholder="Ej. Juan Pérez" autoComplete="name" className={inputClass} />
        </div>

        <div>
          <label htmlFor="business" className="mb-1.5 block text-sm font-medium text-slate-300">Nombre de tu negocio</label>
          <input id="business" value={business} onChange={(e) => setBusiness(e.target.value)} maxLength={80} required placeholder="Ej. Tacos El Güero" autoComplete="organization" className={inputClass} />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">Correo electrónico</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@negocio.com" className={inputClass} />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">Contraseña</label>
          <input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className={inputClass} />
        </div>

        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-slate-300">Confirmar contraseña</label>
          <input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite tu contraseña" className={inputClass} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
    </AuthShell>
  );
}
