"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function DebugPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [log, setLog] = useState([]);

  const add = (msg) => setLog((l) => [...l, `${new Date().toLocaleTimeString()} - ${msg}`]);

  useEffect(() => {
    add(`API_KEY definida: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "SI" : "NO"}`);
    add(`AUTH_DOMAIN: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "FALTA"}`);
    add(`PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "FALTA"}`);
    add(`APP_ID definida: ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "SI" : "NO"}`);

    try {
      localStorage.setItem("t", "1");
      localStorage.removeItem("t");
      add("localStorage: funciona");
    } catch {
      add("localStorage: BLOQUEADO");
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      add(u ? `Sesion activa: ${u.email}` : "Sin sesion (user = null)");
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      add(`Login OK: ${cred.user.email}`);
      setTimeout(() => {
        add(`3 seg despues, currentUser: ${auth.currentUser ? auth.currentUser.email : "null"}`);
      }, 3000);
    } catch (err) {
      add(`Login ERROR: ${err.code}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <h1 className="mb-4 text-xl font-semibold">Diagnostico (temporal)</h1>
      <div className="mb-4 flex max-w-sm flex-col gap-2">
        <input
          className="rounded bg-slate-800 p-2 text-sm"
          placeholder="correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="rounded bg-slate-800 p-2 text-sm"
          type="password"
          placeholder="contrasena"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin} className="rounded bg-indigo-600 p-2 text-sm font-semibold">
          Probar login
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded bg-slate-900 p-4 text-xs">{log.join("\n")}</pre>
    </main>
  );
}