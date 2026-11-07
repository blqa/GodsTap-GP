import { doc, increment, setDoc } from "firebase/firestore/lite";
import { dbLite } from "@/lib/firebaseLite";

// Día en formato YYYY-MM-DD, en hora de Ciudad de México
export function dayKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
}

// Cuenta un escaneo. Nunca lanza error: si falla, la página sigue normal.
export async function countScan(tagId, ownerUid) {
  try {
    // Si recargan la misma pestaña, no se cuenta otra vez
    const storageKey = `gt_scan_${tagId}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // sessionStorage bloqueado: se cuenta de todos modos
    }

    const day = dayKey();
    const write = setDoc(
      doc(dbLite, "scan_days", `${tagId}_${day}`),
      { tag_id: tagId, owner_uid: ownerUid, day, count: increment(1) },
      { merge: true }
    );

    // Máximo 1.5 s de espera, para no retrasar la redirección
    await Promise.race([write, new Promise((resolve) => setTimeout(resolve, 1500))]);
  } catch (err) {
    console.error("No se pudo contar el escaneo:", err);
  }
}