"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import RevokedNotice from "@/components/dashboard/RevokedNotice";
import CompleteProfile from "@/components/dashboard/CompleteProfile";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDoc(doc(db, "users", currentUser.uid), { email: currentUser.email }, { merge: true }).catch(() => {});        
        setChecking(false);
      } else {
        setUser(null);
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" aria-label="GodsTap · by God’s Plan, ir a mis GT">
            <Logo showBy />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/15 text-xs font-semibold uppercase text-brand-400 ring-1 ring-brand-500/30">
                {user.email?.charAt(0) || "U"}
              </span>
              <span className="max-w-[220px] truncate text-sm text-slate-300">{user.email}</span>
            </div>

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