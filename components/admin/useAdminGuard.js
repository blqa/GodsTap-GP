"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { isAdminUid } from "@/lib/admin";

// Devuelve el usuario administrador, o null mientras se confirma.
// Quien no es administrador nunca ve estas pantallas: va directo a la página principal.
export default function useAdminGuard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return;
      if (!isAdminUid(u.uid)) {
        router.replace("/");
        return;
      }
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  return user;
}
