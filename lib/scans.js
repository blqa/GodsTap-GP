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

// Nombre con el que se guarda el clic de un botón (su texto, sin caracteres problemáticos)
export function clickKey(label) {
  return String(label || "")
    .replace(/[.\/\[\]*`~$#]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

// Cuenta un clic en un botón del micrositio. Nunca lanza error ni retrasa el botón.
export async function countClick(tagId, ownerUid, label) {
  try {
    const key = clickKey(label);
    if (!tagId || !ownerUid || !key) return;
    const day = dayKey();
    await setDoc(
      doc(dbLite, "scan_days", `${tagId}_${day}`),
      { tag_id: tagId, owner_uid: ownerUid, day, clicks: { [key]: increment(1) } },
      { merge: true }
    );
  } catch (err) {
    console.error("No se pudo contar el clic:", err);
  }
}
