// Cuenta de administrador. Si la cambias, cámbiala también en las reglas de Firestore (función isAdmin).
export const ADMIN_UID = "FgBIf9XGbma8nNu8TH49IX28FGn1";

export function isAdminUid(uid) {
  return !!uid && uid === ADMIN_UID;
}
