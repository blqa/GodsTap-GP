"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { isAdminUid } from "@/lib/admin";

const TABS = [
  { href: "/dashboard/admin", label: "GT", match: (p) => p === "/dashboard/admin" },
  { href: "/dashboard/admin/cuentas", label: "Cuentas", match: (p) => p.startsWith("/dashboard/admin/cuenta") },
  { href: "/dashboard/admin/registro", label: "Registro", match: (p) => p.startsWith("/dashboard/admin/registro") },
];

// Pestañas del modo administrador. Solo se muestran si la sesión es la del administrador.
export default function AdminNav() {
  const pathname = usePathname() || "";
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setOk(isAdminUid(u?.uid)));
    return () => unsub();
  }, []);

  if (!ok) return null;

  return (
    <nav aria-label="Administración" className="mb-8 flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
      <span className="mr-2 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">Modo administrador</span>
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              active ? "bg-slate-800 text-slate-50" : "text-slate-400 hover:bg-slate-900 hover:text-slate-50"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
