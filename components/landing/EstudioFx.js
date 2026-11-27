"use client";

import { useEffect } from "react";

// Interacciones del estilo "estudio" en la página principal (mismas que godsplan.dev):
// encabezado que se oscurece al bajar, aparición al hacer scroll y luz que sigue al mouse en las tarjetas.
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

    // Aparición al hacer scroll. Lo que ya está a la vista se muestra de una vez para que no parpadee.
    const items = root.querySelectorAll("[data-reveal]");
    const motion = document.documentElement.hasAttribute("data-motion") && "IntersectionObserver" in window;
    if (!motion) {
      items.forEach((el) => el.classList.add("is-in"));
    } else {
      const vh = window.innerHeight;
      items.forEach((el) => {
        if (el.getBoundingClientRect().top < vh * 0.94) el.classList.add("is-in");
      });
      root.classList.add("fx");
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("is-in");
              io.unobserve(en.target);
            }
          }),
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );
      items.forEach((el) => {
        if (!el.classList.contains("is-in")) io.observe(el);
      });
      cleanups.push(() => io.disconnect());
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
