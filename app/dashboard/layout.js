import { Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";

// El panel usa la ruta actual (usePathname), que en rutas dinámicas como /dashboard/admin/cuenta/[uid]
// necesita un Suspense para que Next.js pueda prerenderizar la página.
export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
