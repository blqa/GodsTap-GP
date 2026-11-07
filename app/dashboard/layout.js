"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { isAdminUid } from "@/lib/admin";
import { CONTACT_EMAIL, whatsappLink } from "@/lib/contact";
import RevokedNotice from "@/components/dashboard/RevokedNotice";
import CompleteProfile from "@/components/dashboard/CompleteProfile";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [suspended, setSuspended] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const admin = isAdminUid(currentUser.uid);
        // ¿La cuenta fue suspendida desde el modo administrador?
        getDoc(doc(db, "users", currentUser.uid))
          .then((snap) => {
            const data = snap.exists() ? snap.data() : null;
            setSuspended(!admin && !!(data?.suspended || data?.deleted));
            // Una cuenta eliminada no se vuelve a crear con el merge de abajo
            if (!(data?.deleted && !admin)) {
              setDoc(doc(db, "users", currentUser.uid), { email: currentUser.email }, { merge: true }).catch(() => {});
            }
          })
          .catch(() => {
            setDoc(doc(db, "users", currentUser.uid), { email: currentUser.email }, { merge: true }).catch(() => {});
          })
          .finally(() => setChecking(false));
      } else {
        setUser(null);
        // Quien no ha iniciado sesión y trata de entrar al admin va a la página principal
        router.replace(pathname?.startsWith("/dashboard/admin") ? "/" : "/login");
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      setSigningOut(false);
    }
  };

// Estado de carga mientras se confirma la sesión (o se redirige)
  if (checking || !user) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="h-8 w-8 animate-spin text-brand-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="text-sm text-slate-400">Verificando sesión...</p>
          </div>
        </div>
        
        {/* Aquí está el truco: le damos a Next.js sus children, pero invisibles */}
        <div className="hidden">{children}</div>
      </>
    );
  }

  if (suspended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <Logo className="mb-6" />
          <h1 className="text-2xl font-bold text-slate-50">Cuenta suspendida</h1>
          <p className="mt-3 text-sm text-slate-400">
            Tu cuenta está pausada por ahora. Escríbenos y la revisamos contigo.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <a
              href={whatsappLink("Hola, mi cuenta de GodsTap aparece suspendida.")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
            >
              Escribir por WhatsApp
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              {CONTACT_EMAIL}
            </a>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-lg px-4 py-2.5 text-sm text-slate-400 transition hover:text-slate-200"
            >
              {signingOut ? "Saliendo..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = isAdminUid(user.uid);
  const inAdmin = pathname?.startsWith("/dashboard/admin");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={isAdmin ? "/dashboard/admin" : "/dashboard"} aria-label="GodsTap · by God’s Plan, ir al inicio del panel">
            <Logo showBy />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/15 text-xs font-semibold uppercase text-brand-400 ring-1 ring-brand-500/30">
                {user.email?.charAt(0) || "U"}
              </span>
              <span className="max-w-[220px] truncate text-sm text-slate-300">{user.email}</span>
            </div>

            {isAdmin && (
              <Link
                href={inAdmin ? "/dashboard" : "/dashboard/admin"}
                className="rounded-lg border border-brand-500/40 bg-brand-600/10 px-3 py-2 text-sm font-medium text-brand-300 transition hover:bg-brand-600/20"
              >
                {inAdmin ? "Mis GT" : "Administración"}
              </Link>
            )}

            <ThemeToggle />

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingOut ? "Saliendo..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </header>
    <RevokedNotice uid={user.uid} />
    <CompleteProfile uid={user.uid} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}