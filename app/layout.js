import localFont from "next/font/local";
import "./globals.css";
import { BASE_URL } from "@/lib/site";

// Tipografía de God's Plan (DESIGN_SYSTEM.md §3), alojada en el propio proyecto.
// Son los mismos archivos que usan godsplan.dev y rig.godsplan.dev.
const display = localFont({
  src: "./fonts/Montserrat-var.woff2",
  weight: "500 900",
  style: "normal",
  variable: "--font-montserrat",
  display: "swap",
});

const body = localFont({
  src: "./fonts/Inter-var.woff2",
  weight: "300 700",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
});

const mono = localFont({
  src: "./fonts/MartianMono-var.woff2",
  weight: "300 600",
  style: "normal",
  variable: "--font-martian",
  display: "swap",
  preload: false,
});

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: "GodsTap · by God’s Plan",
  description: "Smart Tags NFC para negocios locales.",
  openGraph: {
    title: "GodsTap · by God’s Plan",
    description: "Acerca el celular y aparece tu negocio. Smart Tags NFC para negocios locales.",
    siteName: "GodsTap · by God’s Plan",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GodsTap · by God’s Plan",
    description: "Acerca el celular y aparece tu negocio. Smart Tags NFC para negocios locales.",
  },
};

// Se ejecuta antes de pintar la página para que no haya parpadeo al cambiar de tema.
// Oscuro por defecto; si la persona eligió claro, se respeta.
const themeScript = `try{var t=localStorage.getItem("gt-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
