// Operaciones del administrador sobre cuentas y GT. Todas dejan un registro en audit_logs.
import { initializeApp, getApps } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from "firebase/auth";
import { collection, deleteField, doc, serverTimestamp, Timestamp, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { addLogToBatch, logEvent } from "@/lib/audit";
import { SUPPORT_EMAIL, CONTACT_PHONE } from "@/lib/contact";
import { PLANS, addMonths, formatDate, planStatus } from "@/lib/plans";

export const BASE_URL = "https://godstap.godsplan.site";
export const DEFAULT_NAME = "GT sin activar";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function randomCode(length = 10) {
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => CODE_CHARS[n % CODE_CHARS.length]).join("");
}

export function randomPassword(length = 12) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

// Deja un GT sin dueño, con código nuevo y configuración de fábrica. Se hace dentro de un batch.
export function releaseTagInBatch(batch, tag, { reason = "", notify = false, action = "tag_revoked", summary = "" } = {}) {
  const newCode = randomCode(10);
  batch.update(doc(db, "tags", tag.id), {
    owner_uid: deleteField(),
    claimed_at: deleteField(),
    links: deleteField(),
    theme: deleteField(),
    tagline: deleteField(),
    menu: deleteField(),
    logo: deleteField(),
    cover: deleteField(),
    gallery: deleteField(),
    nickname: deleteField(),
    plan_until: deleteField(),
    plan: "basic",
    status: "unclaimed",
    business_name: DEFAULT_NAME,
    mode: "microsite",
    target_url: BASE_URL,
    updated_at: serverTimestamp(),
  });
  batch.set(doc(db, "activation_codes", tag.id), { code: newCode });
  batch.delete(doc(db, "claims", tag.id));
  if (notify && tag.owner_uid) {
    batch.set(doc(collection(db, "notices")), {
      owner_uid: tag.owner_uid,
      tag_id: tag.id,
      business_name: tag.business_name || "",
      reason,
      contact_email: SUPPORT_EMAIL,
      contact_phone: CONTACT_PHONE,
      read: false,
      created_at: serverTimestamp(),
    });
  }
  addLogToBatch(batch, {
    action,
    owner_uid: tag.owner_uid || "",
    tag_id: tag.id,
    business_name: tag.business_name || "",
    summary: summary || (reason ? `Se liberó el GT. Motivo: ${reason}` : "Se liberó el GT."),
  });
  return newCode;
}

// Revocar un GT con aviso al cliente
export async function revokeTag(tag, reason) {
  const batch = writeBatch(db);
  const code = releaseTagInBatch(batch, tag, { reason, notify: true });
  await batch.commit();
  return code;
}

// Dar un GT sin dueño a una cuenta
export async function assignTag(tag, ownerUid, ownerLabel) {
  const batch = writeBatch(db);
  batch.update(doc(db, "tags", tag.id), {
    owner_uid: ownerUid,
    status: "active",
    claimed_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  addLogToBatch(batch, {
    action: "tag_assigned",
    owner_uid: ownerUid,
    tag_id: tag.id,
    business_name: ownerLabel || "",
    summary: `Asignó el GT ${tag.id} a la cuenta ${ownerLabel || ownerUid}.`,
  });
  await batch.commit();
}

// Crea el acceso (Firebase Auth) usando una segunda conexión, para no cerrar tu sesión de administrador.
export async function createAuthUser(email, password) {
  const name = "godstap-admin-create";
  const app = getApps().find((a) => a.name === name) || initializeApp(auth.app.options, name);
  const secondary = getAuth(app);
  const cred = await createUserWithEmailAndPassword(secondary, email, password);
  const uid = cred.user.uid;
  await signOut(secondary);
  return uid;
}

export async function createProfile(uid, { email, name, business_name }) {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid), {
    email,
    name,
    business_name,
    created_at: serverTimestamp(),
    created_by_admin: true,
  });
  addLogToBatch(batch, {
    action: "account_created_by_admin",
    owner_uid: uid,
    business_name,
    summary: `Creó la cuenta de ${name || email} (${email}).`,
  });
  await batch.commit();
}

export async function updateProfile(uid, before, { name, business_name }) {
  const changes = [];
  if ((before.name || "") !== name) changes.push("nombre");
  if ((before.business_name || "") !== business_name) changes.push("negocio");
  const batch = writeBatch(db);
  batch.update(doc(db, "users", uid), { name, business_name });
  addLogToBatch(batch, {
    action: "account_updated",
    owner_uid: uid,
    business_name,
    summary: changes.length ? `Cambió: ${changes.join(", ")}.` : "Guardó el perfil sin cambios.",
  });
  await batch.commit();
}

export async function setSuspended(uid, profile, suspended) {
  const batch = writeBatch(db);
  batch.update(
    doc(db, "users", uid),
    suspended ? { suspended: true } : { suspended: deleteField(), deleted_at: deleteField() }
  );
  addLogToBatch(batch, {
    action: suspended ? "account_suspended" : "account_reactivated",
    owner_uid: uid,
    business_name: profile?.business_name || "",
    summary: suspended ? "Suspendió la cuenta." : "Reactivó la cuenta.",
  });
  await batch.commit();
}

// Elimina la cuenta de la plataforma: libera sus GT y deja el perfil marcado como eliminado.
// (El inicio de sesión de Firebase Auth no se puede borrar desde el navegador; queda bloqueado.)
export async function deleteAccount(uid, profile, tags) {
  const batch = writeBatch(db);
  tags.forEach((t) =>
    releaseTagInBatch(batch, t, {
      notify: false,
      summary: "Se liberó el GT porque se eliminó la cuenta.",
    })
  );
  batch.set(doc(db, "users", uid), {
    email: profile?.email || "",
    suspended: true,
    deleted_at: serverTimestamp(),
  });
  addLogToBatch(batch, {
    action: "account_deleted",
    owner_uid: uid,
    business_name: profile?.business_name || "",
    summary: `Eliminó la cuenta de ${profile?.name || profile?.email || uid} y liberó ${tags.length} GT.`,
  });
  await batch.commit();
}

export async function sendResetEmail(uid, profile) {
  await sendPasswordResetEmail(auth, profile.email);
  await logEvent({
    action: "password_reset_sent",
    owner_uid: uid,
    business_name: profile?.business_name || "",
    summary: `Envió el correo para cambiar contraseña a ${profile.email}.`,
  });
}


// Cambia el plan de uno o varios GT.
// months > 0: vence en esa cantidad de meses (si ya tenía ese plan vigente, se suma a su fecha actual: renovación).
// months = 0 o plan Básico: sin vencimiento. Devuelve { id: Timestamp } con las fechas nuevas.
export async function applyPlan(items, plan, months = 0) {
  const now = Date.now();
  const batch = writeBatch(db);
  const newUntil = {};
  items.forEach((r) => {
    const data = { plan, updated_at: serverTimestamp() };
    let detail = `Plan ${PLANS[plan].label}`;
    if (PLANS[plan].paid && months > 0) {
      const st = planStatus(r);
      const base = st.paid && st.plan === plan && st.until && st.until > now ? st.until : now;
      const until = addMonths(base, months);
      newUntil[r.id] = Timestamp.fromDate(until);
      data.plan_until = newUntil[r.id];
      detail += ` hasta el ${formatDate(until.getTime())}`;
    } else {
      data.plan_until = deleteField();
      if (PLANS[plan].paid) detail += " sin vencimiento";
    }
    batch.update(doc(db, "tags", r.id), data);
    addLogToBatch(batch, {
      action: "tag_plan_changed",
      owner_uid: r.owner_uid || "",
      tag_id: r.id,
      business_name: r.business_name || "",
      summary: `${detail} (antes: ${PLANS[planStatus(r).plan].label}).`,
    });
  });
  await batch.commit();
  return newUntil;
}
