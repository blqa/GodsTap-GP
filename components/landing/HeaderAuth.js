"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { isAdminUid } from "@/lib/admin";

// Botones de acceso de la barra superior: si ya hay sesión abierta, lleva directo al panel.
export default function HeaderAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u || null)), []);

  if (user) {
    return (
      <Link
        href={isAdminUid(user.uid) ? "/dashboard/admin" : "/dashboard"}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
      >
        Ir a mi panel
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className="px-3 py-2 text-sm font-medium text-slate-200 transition hover:text-slate-50">
        <span className="sm:hidden">Entrar</span>
        <span className="hidden sm:inline">Iniciar sesión</span>
      </Link>
      <Link
        href="/register"
        className="hidden rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 sm:block"
      >
        Crear cuenta
      </Link>
    </>
  );
}
