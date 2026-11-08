"use client";

import { useEffect, useRef, useState } from "react";
import { IMAGE_SPECS, drawCrop, encodeImage, loadImage } from "@/lib/images";

const btn = "rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-40";

// Campo para subir una imagen (logo o portada): elegir archivo → acomodar el recorte → usar
export default function ImageField({ kind, label, hint, value, onChange }) {
  const spec = IMAGE_SPECS[kind];
  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const [img, setImg] = useState(null);
  const [crop, setCrop] = useState({ zoom: 1, x: 0.5, y: 0.5 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Vista del recorte
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawCrop(ctx, img, canvas.width, canvas.height, crop);
  }, [img, crop]);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      setImg(await loadImage(file));
      setCrop({ zoom: 1, x: 0.5, y: 0.5 });
    } catch (err) {
      setError(err.message || "No pude abrir esa imagen.");
    }
  };

  const accept = () => {
    setBusy(true);
    setError("");
    // se deja respirar a la pantalla antes del trabajo pesado
    setTimeout(() => {
      try {
        onChange(encodeImage(img, kind, crop));
        setImg(null);
      } catch (err) {
        setError(err.message || "No se pudo preparar la imagen.");
      }
      setBusy(false);
    }, 30);
  };

  const previewW = kind === "logo" ? 200 : 320;
  const previewH = Math.round((previewW * spec.h) / spec.w);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-700 bg-slate-950 text-xs text-slate-500 ${
            kind === "logo" ? "h-16 w-16 rounded-full" : "h-16 w-28 rounded-lg"
          }`}
        >
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : "Sin imagen"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => inputRef.current?.click()} className={btn}>
          {value ? "Cambiar" : "Subir imagen"}
        </button>
        {value && !img && (
          <button type="button" onClick={() => onChange("")} className={`${btn} text-red-400 hover:text-red-300`}>
            Quitar
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={pick} className="hidden" />
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {img && (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="mb-2 text-xs text-slate-400">Acomoda la imagen: así se va a ver.</p>
          <canvas
            ref={canvasRef}
            width={previewW * 2}
            height={previewH * 2}
            className={`mx-auto max-w-full border border-slate-700 ${kind === "logo" ? "rounded-full" : "rounded-lg"}`}
            style={{ width: previewW, height: previewH }}
          />
          <div className="mt-3 space-y-2 text-xs text-slate-400">
            {[
              ["zoom", "Acercar", 1, 3, 0.01],
              ["x", "Izquierda ↔ derecha", 0, 1, 0.01],
              ["y", "Arriba ↔ abajo", 0, 1, 0.01],
            ].map(([key, text, min, max, step]) => (
              <label key={key} className="flex items-center gap-3">
                <span className="w-32 shrink-0">{text}</span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={crop[key]}
                  onChange={(e) => setCrop({ ...crop, [key]: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={accept}
              disabled={busy}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-60"
            >
              {busy ? "Preparando..." : "Usar esta imagen"}
            </button>
            <button type="button" onClick={() => setImg(null)} disabled={busy} className={btn}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
