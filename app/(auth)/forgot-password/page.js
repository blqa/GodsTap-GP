"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import AuthShell from "@/components/AuthShell";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      // Si la cuenta no existe mostramos el mismo mensaje de éxito, para no revelar qué correos están registrados.
      if (err.code === "auth/user-not-found") {
        setSent(true);
      } else if (err.code === "auth/invalid-email") {
        setError("El correo no es válido.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos. Inténtalo más tarde.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Error de red. Revisa tu conexión.");
      } else {
        setError("No se pudo enviar el correo. Inténtalo de nuevo.");
      }
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title="Recupera tu contraseña"
      subtitle="Escribe tu correo y te enviamos un enlace para crear una nueva."
      footer={
        <Link href="/login" className="font-medium text-brand-400 hover:text-brand-300">
          Volver a iniciar sesión
        </Link>
      }
    >
      {sent ? (
        <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-300">
          <p className="font-semibold">Revisa tu correo</p>
          <p className="mt-1">
            Si hay una cuenta con ese correo, te enviamos el enlace. Si no lo ves en unos minutos, revisa la carpeta de spam.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@negocio.com"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
