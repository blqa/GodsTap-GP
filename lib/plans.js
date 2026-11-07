// El contacto se cambia en lib/contact.js
export { SUPPORT_EMAIL } from "./contact";

export const PLANS = {
  basic: { label: "Básico", paid: false },
  pro: { label: "Pro", paid: true },
  business: { label: "Negocio", paid: true },
};

// Si pones false, los planes de pago también muestran "GodsTap · by God’s Plan"
export const HIDE_BRAND_FOR_PAID = true;

export function planOf(plan) {
  return Object.prototype.hasOwnProperty.call(PLANS, plan) ? plan : "basic";
}

export function isPaid(plan) {
  return PLANS[planOf(plan)].paid;
}

export function showBrand(plan) {
  return !(isPaid(plan) && HIDE_BRAND_FOR_PAID);
}