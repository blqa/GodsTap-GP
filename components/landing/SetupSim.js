"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Microsite from "@/components/Microsite";
import PhoneFrame from "@/components/landing/PhoneFrame";
import { PRESETS } from "@/lib/microsite";

// Simulación del asistente: nada se guarda, solo muestra lo fácil que es.
const TYPES = [
  {
    id: "cafe",
    label: "Cafetería",
    sample: "Café Luna",
    tagline: "Café de especialidad · 8:00 a 21:00",
    preset: "Café",
    cover: "/demo/cafe-cover.jpg",
    menuLabel: "Ver menú",
    menu: [
      { title: "Café", items: [{ name: "Americano", price: "42" }, { name: "Capuchino", price: "58" }, { name: "Latte", price: "62", desc: "Con leche de avena" }] },
      { title: "Postres", items: [{ name: "Pastel de zanahoria", price: "60" }, { name: "Brownie", price: "45" }] },
    ],
  },
  {
    id: "barber",
    label: "Barbería",
    sample: "Barbería Don Pepe",
    tagline: "Corte clásico y barba · Con cita",
    preset: "Carbón",
    cover: "/demo/barberia-cover.jpg",
    menuLabel: "Ver servicios",
    menu: [
      { title: "Servicios", items: [{ name: "Corte clásico", price: "150" }, { name: "Barba y toalla caliente", price: "120" }, { name: "Corte + barba", price: "240" }] },
    ],
  },
  {
    id: "clinic",
    label: "Consultorio",
    sample: "Consultorio Sonrisa",
    tagline: "Salud dental · Lunes a sábado",
    preset: "Cielo",
    cover: "/demo/dental-cover.jpg",
    menuLabel: "Ver servicios",
    menu: [
      { title: "Consultas", items: [{ name: "Valoración", price: "300" }, { name: "Limpieza dental", price: "650" }, { name: "Blanqueamiento", price: "2,800" }] },
    ],
  },
  {
    id: "other",
    label: "Otro",
    sample: "Tu negocio",
    tagline: "Bienvenido · Estamos para servirte",
    preset: "Atardecer",
    cover: null,
    menuLabel: "Ver catálogo",
    menu: [{ title: "Lo más pedido", items: [{ name: "Producto o servicio 1", price: "100" }, { name: "Producto o servicio 2", price: "180" }] }],
  },
];

const BUTTONS = [
  { id: "whatsapp", label: "Pedir por WhatsApp", emoji: "💬", link: { label: "Pedir por WhatsApp", icon: "whatsapp", url: "https://wa.me/525555010101" } },
  { id: "maps", label: "Cómo llegar", emoji: "📍", link: { label: "Cómo llegar", icon: "maps", url: "https://www.google.com/maps" } },
  { id: "instagram", label: "Instagram", emoji: "📷", link: { label: "Síguenos en Instagram", icon: "instagram", url: "https://instagram.com" } },
  { id: "reviews", label: "Reseñas", emoji: "⭐", link: { label: "Dejarnos una reseña", icon: "reviews", url: "https://www.google.com/maps" } },
  { id: "phone", label: "Llamar", emoji: "📞", link: { label: "Llamar ahora", icon: "phone", url: "tel:+525555010101" } },
  { id: "wifi", label: "WiFi para clientes", emoji: "📶", link: { label: "WiFi para clientes", icon: "wifi", url: "", data: { ssid: "MiNegocio_Clientes", password: "bienvenido" } } },
];

const STEP_TITLES = ["Tu negocio", "Tu estilo", "Tus botones", "¡Listo!"];

const chip = (on) =>
  `rounded-full border px-3.5 py-2 text-sm transition ${
    on ? "border-brand-500 bg-brand-600/20 text-slate-50" : "border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-900"
  }`;

export default function SetupSim() {
  const [step, setStep] = useState(0);
  const [typeId, setTypeId] = useState("cafe");
  const [name, setName] = useState("");
  const [presetName, setPresetName] = useState("Café");
  const [withCover, setWithCover] = useState(true);
  const [picked, setPicked] = useState(["whatsapp", "maps"]);
  const [withMenu, setWithMenu] = useState(true);
  const [seconds, setSeconds] = useState(null);
  const startedAt = useRef(0);
  const presetTouched = useRef(false);

  const type = TYPES.find((t) => t.id === typeId);
  const preset = PRESETS.find((p) => p.name === presetName) || PRESETS[0];
  const shownName = name.trim() || type.sample;

  const touch = () => {
    if (!startedAt.current) startedAt.current = Date.now();
  };

  const pickType = (t) => {
    touch();
    setTypeId(t.id);
    if (!presetTouched.current) setPresetName(t.preset);
    if (!t.cover) setWithCover(false);
    else setWithCover(true);
  };

  const toggle = (id) => {
    touch();
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const goTo = (n) => {
    touch();
    if (n === 3 && seconds === null) setSeconds(Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)));
    setStep(n);
  };

  const reset = () => {
    startedAt.current = 0;
    presetTouched.current = false;
    setStep(0);
    setTypeId("cafe");
    setName("");
    setPresetName("Café");
    setWithCover(true);
    setPicked(["whatsapp", "maps"]);
    setWithMenu(true);
    setSeconds(null);
  };

  const links = useMemo(() => BUTTONS.filter((b) => picked.includes(b.id)).map((b) => b.link), [picked]);
  const menu = useMemo(
    () => (withMenu ? { label: type.menuLabel, note: "", sections: type.menu.map((s) => ({ title: s.title, items: s.items.map((it) => ({ desc: "", ...it })) })) } : undefined),
    [withMenu, type]
  );

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
      {/* Controles */}
      <div className="order-2 lg:order-1">
        {/* Pasos */}
        <ol className="mb-6 flex gap-2" aria-label="Pasos de la configuración">
          {STEP_TITLES.map((t, n) => (
            <li key={t} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => goTo(n)}
                aria-current={n === step ? "step" : undefined}
                className="group block w-full text-left"
              >
                <span className={`block h-1.5 rounded-full transition ${n <= step ? "bg-brand-500" : "bg-slate-700"}`} />
                <span className={`mt-2 block truncate text-xs ${n === step ? "font-semibold text-slate-50" : "text-slate-500 group-hover:text-slate-300"}`}>
                  {n + 1}. {t}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="min-h-[17rem] rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
          {step === 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-50">¿Qué tipo de negocio tienes?</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button key={t.id} type="button" onClick={() => pickType(t)} aria-pressed={t.id === typeId} className={chip(t.id === typeId)}>
                    {t.label}
                  </button>
                ))}
              </div>
              <label htmlFor="sim-name" className="mt-5 block text-sm font-medium text-slate-300">
                ¿Cómo se llama?
              </label>
              <input
                id="sim-name"
                value={name}
                onChange={(e) => {
                  touch();
                  setName(e.target.value);
                }}
                maxLength={32}
                placeholder={type.sample}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              />
              <p className="mt-2 text-xs text-slate-500">Escribe y mira cómo cambia el celular.</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-50">Elige un estilo</h3>
              <p className="mt-1 text-sm text-slate-400">Hay más de 18 listos para usar, y puedes ajustar cada color.</p>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {PRESETS.slice(0, 12).map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      touch();
                      presetTouched.current = true;
                      setPresetName(p.name);
                    }}
                    aria-pressed={p.name === presetName}
                    className={`rounded-xl border p-1.5 text-left transition ${p.name === presetName ? "border-brand-500 ring-2 ring-brand-500/40" : "border-slate-700 hover:border-slate-500"}`}
                  >
                    <span className="flex h-9 items-end rounded-lg p-1.5" style={{ backgroundColor: p.bg }}>
                      <span className="h-2 w-full rounded-full" style={{ backgroundColor: p.accent }} />
                    </span>
                    <span className="mt-1 block truncate px-0.5 text-xs text-slate-300">{p.name}</span>
                  </button>
                ))}
              </div>
              {type.cover && (
                <button
                  type="button"
                  onClick={() => {
                    touch();
                    setWithCover((v) => !v);
                  }}
                  aria-pressed={withCover}
                  className={`mt-4 ${chip(withCover)}`}
                >
                  🖼️ Foto de portada
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-50">¿Qué quieres que hagan tus clientes?</h3>
              <p className="mt-1 text-sm text-slate-400">Toca para agregar o quitar botones.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    touch();
                    setWithMenu((v) => !v);
                  }}
                  aria-pressed={withMenu}
                  className={chip(withMenu)}
                >
                  🍽️ {type.menuLabel}
                </button>
                {BUTTONS.map((b) => (
                  <button key={b.id} type="button" onClick={() => toggle(b.id)} aria-pressed={picked.includes(b.id)} className={chip(picked.includes(b.id))}>
                    {b.emoji} {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm font-medium text-brand-400">Listo en {seconds ?? 1} {seconds === 1 ? "segundo" : "segundos"}</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-50">Así de fácil. Tu GT ya sabe qué mostrar.</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Esto fue una simulación. En tu panel real también subes tu logo y tu foto, escribes tu menú completo, agregas tus datos de pago o tu WiFi, y lo cambias cuando quieras sin tocar el chip.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/register" className="rounded-xl bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-500">
                  Crear mi cuenta
                </Link>
                <button type="button" onClick={reset} className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-900">
                  Probar con otro negocio
                </button>
              </div>
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              disabled={step === 0}
              className="rounded-lg px-4 py-2.5 text-sm text-slate-400 transition hover:text-slate-100 disabled:invisible"
            >
              ← Atrás
            </button>
            <button
              type="button"
              onClick={() => goTo(step + 1)}
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
            >
              {step === 2 ? "Terminar" : "Siguiente →"}
            </button>
          </div>
        )}
      </div>

      {/* Vista previa en vivo */}
      <div className="order-1 flex flex-col items-center lg:order-2">
        <PhoneFrame className="h-[30rem] w-[15rem] sm:h-[33rem] sm:w-[16.5rem]">
          <Microsite
            preview
            name={shownName}
            tagline={type.tagline}
            links={links}
            menu={menu}
            theme={preset}
            cover={withCover ? type.cover : undefined}
          />
        </PhoneFrame>
        <p className="mt-3 text-xs text-slate-500">Vista previa en vivo</p>
      </div>
    </div>
  );
}
