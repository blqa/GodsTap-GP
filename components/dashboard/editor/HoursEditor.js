"use client";

import { memo } from "react";
import { DAY_NAMES, EMPTY_HOURS, parseRange } from "@/lib/hours";

const timeClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-50 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:opacity-40";
const small = "rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800";

const DEFAULT_RANGE = "09:00-18:00";

// Horario de atención: 7 días, cada uno abierto (con hora de apertura y cierre) o cerrado
function HoursEditor({ hours, setHours }) {
  const active = hours.some(Boolean);

  const setDay = (i, value) => setHours(hours.map((h, k) => (k === i ? value : h)));
  const setPart = (i, part, value) => {
    const [o, c] = (parseRange(hours[i]) ? hours[i] : DEFAULT_RANGE).split("-");
    setDay(i, part === "open" ? `${value || o}-${c}` : `${o}-${value || c}`);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-50">Horario de atención (opcional)</h3>
          <p className="text-xs text-slate-500">Tu página dirá sola si estás «Abierto» o «Cerrado» en ese momento.</p>
        </div>
        {active ? (
          <button type="button" onClick={() => setHours(EMPTY_HOURS)} className="text-xs text-red-400 hover:text-red-300">
            Quitar horario
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setHours([DEFAULT_RANGE, DEFAULT_RANGE, DEFAULT_RANGE, DEFAULT_RANGE, DEFAULT_RANGE, DEFAULT_RANGE, ""])}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            + Agregar horario
          </button>
        )}
      </div>

      {active && (
        <>
          <ul className="mt-4 space-y-2">
            {DAY_NAMES.map((dayName, i) => {
              const isOpen = Boolean(parseRange(hours[i]));
              const [o, c] = isOpen ? hours[i].split("-") : ["", ""];
              return (
                <li key={dayName} className="grid grid-cols-[6.5rem_1fr_1fr] items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={isOpen}
                      onChange={(e) => setDay(i, e.target.checked ? DEFAULT_RANGE : "")}
                      className="h-4 w-4 accent-brand-600"
                    />
                    {dayName}
                  </label>
                  {isOpen ? (
                    <>
                      <input type="time" value={o} onChange={(e) => setPart(i, "open", e.target.value)} aria-label={`${dayName}: abre`} className={timeClass} />
                      <input type="time" value={c} onChange={(e) => setPart(i, "close", e.target.value)} aria-label={`${dayName}: cierra`} className={timeClass} />
                    </>
                  ) : (
                    <span className="col-span-2 text-sm text-slate-500">Cerrado</span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setHours(hours.map(() => hours[0]))} className={small}>
              Copiar el lunes a todos los días
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Primero la hora en que abres y luego la hora en que cierras. Si cierras después de medianoche, ponlo tal cual
            (ej. abres a las 6 de la tarde y cierras a las 2 de la mañana). La misma hora en las dos casillas significa abierto las 24 horas.
          </p>
        </>
      )}
    </div>
  );
}

export default memo(HoursEditor);
