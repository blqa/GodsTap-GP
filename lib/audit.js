import { addDoc, collection, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { isAdminUid } from "@/lib/admin";

// Registro de movimientos (colección audit_logs). Los registros no se pueden editar ni borrar.
export const ACTION_LABELS = {
  account_created: "Cuenta creada",
  account_created_by_admin: "Cuenta creada por admin",
  account_updated: "Cuenta editada",
  account_suspended: "Cuenta suspendida",
  account_reactivated: "Cuenta reactivada",
  account_deleted: "Cuenta eliminada",
  password_reset_sent: "Correo de contraseña enviado",
  tag_batch_created: "Lote de GT creado",
  tag_claimed: "GT vinculado",
  tag_assigned: "GT asignado por admin",
  tag_updated: "GT configurado",
  tag_updated_by_admin: "GT editado por admin",
  tag_plan_changed: "Plan cambiado",
  tag_revoked: "GT revocado",
  tag_deleted: "GT borrado",
};

// Datos de un registro. Los campos están limitados por las reglas de Firestore.
export function logData({ action, owner_uid = "", tag_id = "", business_name = "", summary = "" }) {
  const u = auth.currentUser;
  return {
    at: serverTimestamp(),
    actor_uid: u?.uid || "",
    actor_email: u?.email || "",
    actor_role: isAdminUid(u?.uid) ? "admin" : "cliente",
    action,
    owner_uid: owner_uid || "",
    tag_id: tag_id || "",
    business_name: String(business_name || "").slice(0, 80),
    summary: String(summary || "").slice(0, 300),
  };
}

// Para guardar el registro dentro de un batch (junto con el cambio que describe)
export function addLogToBatch(batch, payload) {
  batch.set(doc(collection(db, "audit_logs")), logData(payload));
}

// Para guardarlo por separado. Nunca interrumpe la acción principal si falla.
export async function logEvent(payload) {
  try {
    await addDoc(collection(db, "audit_logs"), logData(payload));
  } catch (err) {
    console.error("No se pudo guardar el registro:", err);
  }
}

export function formatDateTime(ms) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  });
}

export function tsMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return 0;
}
