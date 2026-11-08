"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { isAdminUid } from "@/lib/admin";

// Si la persona ya tiene la sesión abierta al llegar a esta pantalla (inicio de sesión o registro),
// la manda directo a su panel. Solo mira el estado inicial, para no estorbar al registrarse.
export function useRedirectIfSignedIn() {
  const router = useRouter();
  useEffect(() => {
    let first = true;
    const off = onAuthStateChanged(auth, (user) => {
      if (!first) return;
      first = false;
      if (user) router.replace(isAdminUid(user.uid) ? "/dashboard/admin" : "/dashboard");
    });
    return () => off();
  }, [router]);
}
