// El contacto se cambia en lib/contact.js
export { SUPPORT_EMAIL } from "./contact";

export const PLANS = {
  basic: { label: "Básico", paid: false },
  pro: { label: "Pro", paid: true },
  business: { label: "Negocio", paid: true },
};

// Si pones false, los planes de pago también muestran "GodsTap · by God’s Plan"
export const HIDE_BRAND_FOR_PAID = true;

// Cuántos días antes del vencimiento se avisa
export const EXPIRY_WARNING_DAYS = 7;

export function planOf(plan) {
  return Object.prototype.hasOwnProperty.call(PLANS, plan) ? plan : "basic";
}

export function isPaid(plan) {
  return PLANS[planOf(plan)].paid;
}

export function showBrand(plan) {
  return !(isPaid(plan) && HIDE_BRAND_FOR_PAID);
}

/* ---------------------------------------------------------------
   Vencimiento del plan
   Cada GT puede tener plan_until (fecha de Firestore).
   Sin fecha = no vence. Con fecha pasada = se comporta como Básico.
   Solo llamar estas funciones con datos ya cargados (no al prerenderizar).
---------------------------------------------------------------- */

export function untilMs(tag) {
  const u = tag?.plan_until;
  if (!u) return null;
  if (typeof u.toMillis === "function") return u.toMillis();
  if (typeof u.seconds === "number") return u.seconds * 1000;
  return null;
}

export function planStatus(tag) {
  const plan = planOf(tag?.plan);
  const paidPlan = PLANS[plan].paid;
  const until = paidPlan ? untilMs(tag) : null;
  const now = Date.now();
  const expired = paidPlan && until !== null && until <= now;
  const daysLeft = paidPlan && until !== null && !expired ? Math.ceil((until - now) / 86400000) : null;
  return {
    plan, // plan guardado
    effective: expired ? "basic" : plan, // plan que realmente se aplica hoy
    paid: paidPlan && !expired,
    expired,
    until,
    daysLeft,
    expiringSoon: daysLeft !== null && daysLeft <= EXPIRY_WARNING_DAYS,
  };
}

export function tagIsPaid(tag) {
  return planStatus(tag).paid;
}

export function tagShowBrand(tag) {
  return !(tagIsPaid(tag) && HIDE_BRAND_FOR_PAID);
}

export function formatDate(ms) {
  return new Date(ms).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Mexico_City",
  });
}

// Suma meses de calendario (31 ene + 1 mes = 28 feb)
export function addMonths(ms, n) {
  const d = new Date(ms);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}
