"use client";

import { useEffect, useRef } from "react";

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Fondo animado del micrositio (canvas): partículas, burbujas o destellos que flotan despacio.
// Se detiene si la pestaña está oculta y, con "reducir movimiento" activado, se dibuja quieto.
export default function MicrositeFx({ style = "particles", accent, fg }) {
  const ref = useRef(null);

  useEffect(() => {
    if (style === "none") return undefined;
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return undefined;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const rnd = (a, b) => a + Math.random() * (b - a);
    let w = 1;
    let h = 1;
    let raf = 0;
    let last = 0;
    let parts = [];

    const make = (initial) => {
      const big = style === "bubbles";
      return {
        x: rnd(0, w),
        y: initial ? rnd(0, h) : h + 30,
        r: big ? rnd(6, 22) : style === "sparkles" ? rnd(2, 5.5) : rnd(0.8, 3.2),
        vy: big ? rnd(10, 26) : rnd(6, 20),
        amp: rnd(4, 16),
        sw: rnd(0.2, 0.7),
        tw: rnd(0.6, 2.2),
        ph: rnd(0, Math.PI * 2),
        useAccent: Math.random() < 0.62,
      };
    };

    const resize = () => {
      const r = host.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bubbles = style === "bubbles";
      const target = Math.round(Math.min(bubbles ? 22 : 64, Math.max(bubbles ? 8 : 22, (w * h) / (bubbles ? 38000 : 11000))));
      while (parts.length < target) parts.push(make(true));
      parts.length = Math.min(parts.length, target);
    };

    const draw = (dt, t) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.vy * dt;
        p.x += Math.sin(t * p.sw + p.ph) * p.amp * dt;
        if (p.y < -30) {
          Object.assign(p, make(false));
        }
        const tw = 0.5 + 0.5 * Math.sin(t * p.tw + p.ph);
        const color = p.useAccent ? accent : fg;

        if (style === "bubbles") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = rgba(color, 0.05 + 0.04 * tw);
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = rgba(color, 0.2 + 0.18 * tw);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 0.68, Math.PI * 1.15, Math.PI * 1.55);
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = rgba(color, 0.28);
          ctx.stroke();
        } else if (style === "sparkles") {
          const s = p.r * (0.55 + 0.6 * tw);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - s * 1.9);
          ctx.lineTo(p.x + s * 0.3, p.y - s * 0.3);
          ctx.lineTo(p.x + s * 1.9, p.y);
          ctx.lineTo(p.x + s * 0.3, p.y + s * 0.3);
          ctx.lineTo(p.x, p.y + s * 1.9);
          ctx.lineTo(p.x - s * 0.3, p.y + s * 0.3);
          ctx.lineTo(p.x - s * 1.9, p.y);
          ctx.lineTo(p.x - s * 0.3, p.y - s * 0.3);
          ctx.closePath();
          ctx.fillStyle = rgba(color, 0.18 + 0.5 * tw);
          ctx.fill();
        } else {
          const a = 0.22 + 0.5 * tw;
          if (p.r > 1.8) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
            ctx.fillStyle = rgba(color, a * 0.18);
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = rgba(color, a);
          ctx.fill();
        }
      }
    };

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      draw(dt, now / 1000);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (reduce) {
        draw(0, 0);
        return;
      }
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else start();
    };

    resize();
    start();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { resize(); if (reduce) draw(0, 0); }) : null;
    ro?.observe(host);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [style, accent, fg]);

  if (style === "none") return null;
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
