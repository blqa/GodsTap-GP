import AdminNav from "@/components/admin/AdminNav";

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
