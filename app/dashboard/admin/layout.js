import { Suspense } from "react";
import AdminNav from "@/components/admin/AdminNav";

export default function AdminLayout({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <AdminNav />
      </Suspense>
      {children}
    </>
  );
}
