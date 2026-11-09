"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Microsite from "@/components/Microsite";
import NfcArcs from "@/components/landing/NfcArcs";
import PhoneFrame from "@/components/landing/PhoneFrame";
import { DEMOS } from "@/lib/demoSites";

// Solo los ejemplos inventados; el de FEHLMEX es una muestra privada para su dueño.
const MODELS = DEMOS.filter((d) => d.slug !== "fehlmex");

const Chevron = ({ dir }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === "l" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
  </svg>
);

const arrowClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 backdrop-blur transition hover:border-slate-500 hover:bg-slate-800 active:scale-95";

export default function HeroPhone() {
  const [i, setI] = useState(0);
  const [tap, setTap] = useState(0); // cada toque al GT vuelve a "abrir" el micrositio
  const [auto, setAuto] = useState(true);
  const m = MODELS[i];

  // Cambia solo cada tanto, hasta que la persona toca algo
  useEffect(() => {
    if (!auto) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = setInterval(() => setI((x) => (x + 1) % MODELS.length), 7000);
    return () => clearInterval(id);
  }, [auto]);

  const go = (n) => {
    setAuto(false);
    setI((x) => (x + n + MODELS.length) % MODELS.length);
  };

  return (
    <div
      className="mx-auto w-full max-w-[25rem]"
      role="group"
      aria-roledescription="carrusel"
      aria-label="Ejemplos de micrositios GodsTap"
      onPointerDown={() => setAuto(false)}
    >
      <div className="flex items-center justify-center gap-2">
        <button type="button" onClick={() => go(-1)} aria-label="Ejemplo anterior" className={arrowClass}>
          <Chevron dir="l" />
        </button>

        <div className="relative">
          <div key={`${m.slug}-${tap}`} className="lp-phone-in">
            <PhoneFrame className="h-[33rem] w-[16rem] sm:h-[35rem] sm:w-[17rem]">
              <Microsite
                preview
                name={m.name}
                tagline={m.tagline}
                mainUrl={m.mainUrl}
                links={m.links}
                menu={m.menu}
                theme={m.theme}
                logo={m.logo}
                cover={m.cover}
                hours={m.hours}
              />
            </PhoneFrame>
          </div>

          <button
            type="button"
            onClick={() => {
              setAuto(false);
              setTap((t) => t + 1);
            }}
            aria-label="Acercar el celular al GT para ver el micrositio otra vez"
            className="lp-tag -left-5 bottom-20 sm:-left-12 sm:bottom-24"
          >
            <span className="lp-ring" />
            <span className="lp-ring" />
            <span className="lp-ring" />
            <NfcArcs className="relative w-[58%]" />
            <span className="lp-hint">Toca el GT</span>
          </button>
        </div>

        <button type="button" onClick={() => go(1)} aria-label="Ejemplo siguiente" className={arrowClass}>
          <Chevron dir="r" />
        </button>
      </div>

      <div className="mt-6 text-center" aria-live="polite">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{m.type}</p>
        <p className="mt-1 font-display text-lg font-semibold text-slate-50">{m.name}</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          {MODELS.map((d, k) => (
            <button
              key={d.slug}
              type="button"
              onClick={() => {
                setAuto(false);
                setI(k);
              }}
              aria-label={`Ver ${d.type}`}
              aria-current={k === i}
              className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-brand-500" : "w-2 bg-slate-600 hover:bg-slate-500"}`}
            />
          ))}
        </div>
        <Link href={`/demo/${m.slug}`} className="mt-4 inline-block text-sm font-medium text-brand-400 hover:text-brand-300">
          Abrir este ejemplo completo →
        </Link>
      </div>
    </div>
  );
}
