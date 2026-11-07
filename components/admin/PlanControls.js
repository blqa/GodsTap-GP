"use client";

import { useState } from "react";
import { PLANS, formatDate, planStatus } from "@/lib/plans";

const selectClass = "rounded-md border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-slate-50 sm:px-2 sm:py-1 sm:text-xs";

export const DURATIONS = [
  { value: 1, label: "1 mes" },
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses" },
  { value: 0, label: "Sin vencimiento" },
];

// Etiqueta con el estado del plan de un GT
export function PlanBadge({ r }) {
  const st = planStatus(r);
  let cls = "bg-slate-500/10 text-slate-400 ring-slate-500/30";
  let text = PLANS[st.plan].label;
  if (st.paid) cls = "bg-brand-500/10 text-brand-300 ring-brand-500/30";
  if (st.paid && st.until) text += ` · vence ${formatDate(st.until)}`;
  if (st.paid && !st.until) text += " · sin vencimiento";
  if (st.expiringSoon) cls = "bg-amber-500/10 text-amber-300 ring-amber-500/30";
  if (st.expired) {
    cls = "bg-red-500/10 text-red-300 ring-red-500/30";
    text = `${PLANS[st.plan].label} · venció ${formatDate(st.until)}`;
  }
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${cls}`}>{text}</span>;
}

// Elegir plan + duración y aplicarlo
export function PlanPicker({ initialPlan, onApply, confirmText }) {
  const [plan, setPlan] = useState(initialPlan);
  const [months, setMonths] = useState(1);
  const paid = PLANS[plan].paid;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={plan} onChange={(e) => setPlan(e.target.value)} className={selectClass} aria-label="Plan">
        {Object.entries(PLANS).map(([key, p]) => (
          <option key={key} value={key}>{p.label}</option>
        ))}
      </select>
      {paid && (
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className={selectClass} aria-label="Duración">
          {DURATIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={() => {
          if (confirmText && !confirm(confirmText(plan, paid ? months : 0))) return;
          onApply(plan, paid ? months : 0);
        }}
        className="rounded-md bg-brand-600 px-3.5 py-2 text-sm font-semibold sm:px-2.5 sm:py-1 sm:text-xs text-white transition hover:bg-brand-500"
      >
        Aplicar
      </button>
    </div>
  );
}
