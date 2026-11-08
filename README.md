# GodsTap · by God’s Plan

Smart Tags NFC para negocios locales. El cliente acerca el celular a su **GT** (la etiqueta física) y aparece su negocio: menú, redes, promociones o lo que el dueño decida, editable en cualquier momento desde su cuenta.

**Sitio:** https://godstap.godsplan.site

## Cómo funciona

1. El negocio recibe un GT con un chip NFC ya registrado y un enlace asignado.
2. Crea su cuenta en GodsTap y vincula su GT.
3. Edita su micrositio a su gusto; el cambio se refleja al instante sin tocar la etiqueta.

## Tecnología

- Next.js (App Router) y Tailwind CSS
- Firebase: Auth y Firestore (cliente; sin `firebase-admin`)
- Ruta pública `/t/[tag_id]` para los micrositios
- `@opennextjs/cloudflare` para el despliegue en el borde de Cloudflare

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

Crea un archivo `.env.local` (no se sube a GitHub) con estas variables, que salen de la configuración web de tu proyecto en Firebase:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Otros comandos: `npm run build`, `npm run start`, `npm run lint`.

## Reglas de Firestore

Las reglas viven en `firestore.rules`. Para aplicarlas: Firebase Console → Firestore Database → Reglas → pegar el contenido → Publicar.

## Páginas legales

Aviso de privacidad en `/privacidad` y términos y condiciones en `/terminos`.

---

Un producto de **[God’s Plan](https://godsplan.site)** · agencia de proyectos.
Contacto: [contacto@godsplan.site](mailto:contacto@godsplan.site)
