"use client";

import { useEffect } from "react";

// Interacciones del estilo "estudio" en la página principal (mismas que godsplan.dev):
// encabezado que se oscurece al bajar y luz que sigue al mouse en las tarjetas.
export default function EstudioFx() {
  useEffect(() => {
    const root = document.querySelector(".estudio");
    if (!root) return undefined;
    const cleanups = [];

    // Encabezado
    const header = root.querySelector(".hdr");
    const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    // Luz que sigue al mouse
    if (window.matchMedia("(pointer: fine)").matches) {
      root.querySelectorAll(".card__link").forEach((card) => {
        const move = (e) => {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--sx", `${e.clientX - r.left}px`);
          card.style.setProperty("--sy", `${e.clientY - r.top}px`);
        };
        card.addEventListener("pointermove", move);
        cleanups.push(() => card.removeEventListener("pointermove", move));
      });
    }

    // La aparición al bajar, la barra de progreso, el buscador y los avisos los hace /gp-kit.js (kit de God's Plan)

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
