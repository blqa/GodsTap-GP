"use client";

import { memo, useRef, useState } from "react";
import { GALLERY_MAX, encodePhoto, loadImage } from "@/lib/images";

const btn = "rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 disabled:opacity-30";

// Galería de fotos del negocio: hasta 6, se comprimen en el navegador antes de guardarse
function GalleryEditor({ gallery, setGallery }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const room = GALLERY_MAX - gallery.length;

  const addFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setError("");
    setBusy(true);
    const added = [];
    let skipped = 0;
    try {
      for (const file of files.slice(0, room)) {
        try {
          const img = await loadImage(file);
          // se deja respirar a la pantalla entre foto y foto
          await new Promise((r) => setTimeout(r, 20));
          added.push(encodePhoto(img));
        } catch (err) {
          skipped++;
          setError(err.message || "No pude abrir una de las fotos.");
        }
      }
    } finally {
      if (added.length) setGallery((g) => [...g, ...added].slice(0, GALLERY_MAX));
      if (files.length > room) setError(`Solo caben ${GALLERY_MAX} fotos. Se agregaron las primeras ${room}.`);
      else if (skipped && added.length) setError(`${skipped} foto(s) no se pudieron agregar.`);
      setBusy(false);
    }
  };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= gallery.length) return;
    const copy = [...gallery];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setGallery(copy);
  };

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-50">Galería de fotos</h3>
        <span className="text-xs text-slate-500">
          {gallery.length} de {GALLERY_MAX} fotos
        </span>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Muestra tu trabajo, tu local o tus productos. Tus clientes la abren con un botón y pueden ver cada foto en grande. Las fotos se acomodan y se comprimen solas.
      </p>

      {gallery.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-700 px-4 py-5 text-center text-sm text-slate-500">
          Aún no tienes fotos.
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {gallery.map((src, i) => (
          <li key={`${i}-${src.length}`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">
            <img src={src} alt={`Foto ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
            <div className="mt-2 flex items-center gap-1.5">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover antes" className={btn}>←</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === gallery.length - 1} aria-label="Mover después" className={btn}>→</button>
              <button
                type="button"
                onClick={() => setGallery(gallery.filter((_, k) => k !== i))}
                className="ml-auto rounded-md px-2 py-1.5 text-xs text-red-400 hover:text-red-300"
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || room <= 0}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"
        >
          {busy ? "Preparando fotos..." : "+ Agregar fotos"}
        </button>
        {room <= 0 && <span className="text-xs text-slate-500">Llegaste al máximo. Quita una para agregar otra.</span>}
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={addFiles} className="hidden" />
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default memo(GalleryEditor);
