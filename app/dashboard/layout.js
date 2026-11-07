"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import RevokedNotice from "@/components/dashboard/RevokedNotice";
import CompleteProfile from "@/components/dashboard/CompleteProfile";

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
              className="h-8 w-8 animate-spin text-indigo-500"
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
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-900/40">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
  GodsTap
  <span className="hidden text-sm font-normal text-slate-500 sm:inline"> · by God’s Plan</span>
</span>
          </div>

          {/* Usuario + logout */}
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold uppercase text-slate-300 ring-1 ring-slate-700">
                {user.email?.charAt(0) || "U"}
              </span>
              <span className="max-w-[220px] truncate text-sm text-slate-300">
                {user.email}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
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