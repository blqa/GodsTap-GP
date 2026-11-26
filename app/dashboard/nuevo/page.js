"use client";

// Panel nuevo del cliente. El panel de siempre sigue en /dashboard (no se tocó su lógica).
// Orden: aviso de vigencia → encabezado con estado en vivo y selector de GT → 3 métricas →
// actividad diaria y clics por botón → switch de modo + editor con vista previa → pie.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import TagEditor from "@/components/dashboard/TagEditor";
import SuggestButton from "@/components/SuggestButton";
import ThemeToggle from "@/components/ThemeToggle";
import { LogoMark } from "@/components/Logo";
import { PLANS, formatDate, planStatus, tagIsPaid } from "@/lib/plans";
import { whatsappLink } from "@/lib/contact";
import { logEvent } from "@/lib/audit";
import { isBaseUrl } from "@/lib/site";
import { hoursStatus } from "@/lib/hours";
import { delta, fmt, nfcShare, periodStats, shortDate, weekdayName, weekdayOf } from "@/lib/dashStats";

const DEFAULT_NAME = "GT sin activar";
const ALL = "__all__";
const PICK_KEY = "gt-dash-pick";

// Lo que se ve sin Pro: el total de toques. El canal, el botón estrella y las gráficas piden Pro.
// Si algún día quieres abrir todo en Básico, cambia esto a true.
const FREE_FULL_STATS = false;

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

function isValidUrl(url) {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

const hasRealLink = (tag) => !!tag?.target_url && !isBaseUrl(tag.target_url) && isValidUrl(tag.target_url);
const tagLabel = (t) => t.nickname || t.business_name || t.id;
const proMessage = (ids) => `Hola, quiero desbloquear el plan Pro de GodsTap para mi GT ${ids}`;

function LockIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v7a2 2 0 002 2h8a2 2 0 002-2V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clipRule="evenodd" />
    </svg>
  );
}

function Delta({ d, label }) {
  if (!d) return <p className="mt-2 text-xs text-slate-500">Sin datos del periodo anterior</p>;
  const color = d.up === null ? "text-slate-400" : d.up ? "text-emerald-400" : "text-red-400";
  return (
    <p className="mt-2 text-xs text-slate-500">
      <span className={`font-semibold ${color}`}>
        {d.up === true ? "▲ " : d.up === false ? "▼ " : ""}
        {d.text}
      </span>{" "}
      {label}
    </p>
  );
}

/* ---------------------------------------------------------------
   Cintillo de vigencia: solo si a un Pro le quedan 7 días o ya venció
---------------------------------------------------------------- */
function ExpiryRibbon({ tags }) {
  const items = tags.map((t) => ({ t, st: planStatus(t) })).filter((x) => x.st.expiringSoon || x.st.expired);
  if (!items.length) return null;
  const expired = items.some((x) => x.st.expired);
  const first = items[0];
  const text = expired
    ? `Tu plan ${PLANS[first.st.plan].label} de ${tagLabel(first.t)} venció el ${formatDate(first.st.until)} y volvió a Básico. Tu configuración sigue guardada.`
    : `Tu plan ${PLANS[first.st.plan].label} de ${tagLabel(first.t)} vence ${first.st.daysLeft === 1 ? "mañana" : `en ${first.st.daysLeft} días`}. Renueva para no volver a Básico.`;
  return (
    <div
      role="status"
      className={`mb-6 flex flex-col gap-2 rounded-xl border px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between ${
        expired ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"
      }`}
    >
      <p>
        {text}
        {items.length > 1 ? ` (y ${items.length - 1} GT más)` : ""}
      </p>
      <a
        href={whatsappLink(`Hola, quiero renovar mi plan de GodsTap (${items.map((x) => x.t.id).join(", ")})`)}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 font-semibold underline-offset-2 hover:underline"
      >
        Renovar →
      </a>
    </div>
  );
}

/* ---------------------------------------------------------------
   Vincular un GT (misma lógica que el panel de siempre)
---------------------------------------------------------------- */
function ClaimModal({ user, profile, onClose, onClaimed }) {
  const [form, setForm] = useState({ tag_id: "", code: "", alias: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const tagId = form.tag_id.trim().toLowerCase();
    const code = form.code.trim().toUpperCase().replace(/\s+/g, "");
    if (!tagId || /[\/\s]/.test(tagId) || !code) {
      setError("Escribe el ID del GT y su código de activación.");
      return;
    }
    setBusy(true);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, "claims", tagId), { owner_uid: user.uid, code });
      batch.update(doc(db, "tags", tagId), { owner_uid: user.uid, status: "active", claimed_at: serverTimestamp() });
      await batch.commit();
      const alias = form.alias.trim().slice(0, 40);
      if (alias) {
        try {
          await updateDoc(doc(db, "tags", tagId), { nickname: alias, updated_at: serverTimestamp() });
        } catch (err) {
          console.error("No se pudo guardar el alias:", err);
        }
      }
      await logEvent({
        action: "tag_claimed",
        owner_uid: user.uid,
        tag_id: tagId,
        business_name: profile?.business_name || "",
        summary: `Vinculó el GT ${tagId}${alias ? ` con el alias «${alias}»` : ""}.`,
      });
      await onClaimed(tagId);
    } catch (err) {
      console.error("Error al vincular:", err);
      setError("No pudimos vincular este GT. Revisa el ID y el código, o puede que ya esté vinculado a otra cuenta.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="relative m-auto w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
      >
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 text-slate-500 hover:text-slate-50">
          ✕
        </button>
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Vincular un GT</h2>
          <p className="mt-1 text-sm text-slate-400">Escribe el ID y el código de activación de la tarjeta que viene con tu stand.</p>
        </div>
        {error && (
          <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">ID del GT</label>
          <input autoFocus value={form.tag_id} onChange={(e) => setForm({ ...form, tag_id: e.target.value })} placeholder="gt-k7f3q9" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Código de activación</label>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="XXXXXXXXXX"
            autoComplete="off"
            className={`${inputClass} font-mono uppercase`}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">¿Dónde lo vas a poner? (opcional)</label>
          <input
            value={form.alias}
            onChange={(e) => setForm({ ...form, alias: e.target.value })}
            maxLength={40}
            placeholder="Ej. Caja 1, Mesa 2, Sucursal Norte"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Vinculando..." : "Vincular"}
        </button>
      </form>
    </div>
  );
}

/* ---------------------------------------------------------------
   Tarjeta de métrica (con candado si no tiene Pro)
---------------------------------------------------------------- */
function MetricCard({ title, locked, lockIds, children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <div className={locked ? "pointer-events-none select-none blur-sm" : ""} aria-hidden={locked || undefined}>
        {children}
      </div>
      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/40 p-4 text-center">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-50">
            <LockIcon /> Disponible en Pro
          </span>
          <a
            href={whatsappLink(proMessage(lockIds))}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-500"
          >
            Desbloquear Pro
          </a>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Gráfica de barras de actividad diaria
---------------------------------------------------------------- */
function ActivityChart({ days, series }) {
  const max = Math.max(...series, 1);
  const many = days.length > 10;
  return (
    <div>
      <div className="flex h-40 items-end gap-[3px] sm:gap-1" role="img" aria-label="Toques por día">
        {series.map((v, i) => {
          const w = weekdayOf(days[i]);
          const weekend = w === 0 || w === 6;
          return (
            <div key={days[i]} className="group relative flex h-full min-w-0 flex-1 items-end">
              <div
                className={`w-full rounded-t ${v > 0 ? (weekend ? "bg-brand-500" : "bg-brand-500/45") : "bg-slate-800"}`}
                style={{ height: `${Math.max(3, (v / max) * 100)}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-slate-50 shadow group-hover:block">
                {weekdayName(w).slice(0, 3)} {shortDate(days[i])}: {fmt(v)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px] text-[10px] text-slate-500 sm:gap-1">
        {days.map((d, i) => (
          <span key={d} className="min-w-0 flex-1 text-center">
            {many ? (i % 5 === 0 || i === days.length - 1 ? shortDate(d).split(" ")[0] : "") : weekdayName(weekdayOf(d)).slice(0, 2)}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> Fin de semana
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-500/45" /> Entre semana
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Switch rápido de modo
---------------------------------------------------------------- */
function ModeSwitch({ tag, onChanged }) {
  const current = tag.mode === "redirect" ? "redirect" : "microsite";
  const [askLink, setAskLink] = useState(false);
  const [link, setLink] = useState(hasRealLink(tag) ? tag.target_url : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (mode, url) => {
    setBusy(true);
    setError("");
    try {
      const payload = { mode, updated_at: serverTimestamp() };
      if (url) payload.target_url = url;
      await updateDoc(doc(db, "tags", tag.id), payload);
      await logEvent({
        action: "tag_updated",
        owner_uid: tag.owner_uid || "",
        tag_id: tag.id,
        business_name: tag.business_name || "",
        summary: `Cambió el modo a ${mode === "redirect" ? "redirección directa" : "micrositio"}${url ? " y el enlace" : ""}.`,
      });
      setAskLink(false);
      await onChanged();
    } catch (err) {
      console.error(err);
      setError(`No se pudo cambiar el modo.${err?.code ? ` (${err.code})` : ""}`);
    } finally {
      setBusy(false);
    }
  };

  const pick = (mode) => {
    if (busy) return;
    if (mode === current && !(mode === "redirect" && !hasRealLink(tag))) {
      setAskLink(mode === "redirect");
      return;
    }
    // Redirigir sin un link real mandaría a los clientes a ningún lado: primero se pide el link
    if (mode === "redirect" && !hasRealLink(tag)) {
      setAskLink(true);
      return;
    }
    save(mode);
  };

  const submitLink = (e) => {
    e.preventDefault();
    const url = link.trim();
    if (!isValidUrl(url)) {
      setError("Pega un link que empiece con https://");
      return;
    }
    save("redirect", url);
  };

  const showLink = askLink || (current === "redirect" && hasRealLink(tag));
  const btn = (active) =>
    `flex-1 rounded-lg px-3 py-2.5 text-left transition ${active ? "bg-brand-600 text-white shadow" : "text-slate-300 hover:bg-slate-800"}`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="lg:w-56">
          <h3 className="text-sm font-semibold text-slate-50">¿Qué pasa al acercar el celular?</h3>
          <p className="mt-0.5 text-xs text-slate-500">Cambia con un toque. Se aplica al instante.</p>
        </div>
        <div className="flex flex-1 gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-1" role="radiogroup" aria-label="Modo del GT">
          <button type="button" role="radio" aria-checked={current === "redirect"} disabled={busy} onClick={() => pick("redirect")} className={btn(current === "redirect")}>
            <span className="block text-sm font-semibold">Redirección directa</span>
            <span className={`block text-xs ${current === "redirect" ? "text-white/80" : "text-slate-500"}`}>Pega un link y listo</span>
          </button>
          <button type="button" role="radio" aria-checked={current === "microsite"} disabled={busy} onClick={() => pick("microsite")} className={btn(current === "microsite")}>
            <span className="block text-sm font-semibold">Micrositio</span>
            <span className={`block text-xs ${current === "microsite" ? "text-white/80" : "text-slate-500"}`}>Tu página con botones</span>
          </button>
        </div>
      </div>

      {showLink && (
        <form onSubmit={submitLink} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://… tu menú, WhatsApp, reseñas de Google, Instagram"
            className={inputClass}
            autoFocus={askLink}
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-60"
          >
            {busy ? "Guardando..." : current === "redirect" ? "Cambiar link" : "Activar redirección"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Funciones Pro con candado (palanca de venta)
---------------------------------------------------------------- */
function ProShowcase({ tag }) {
  const features = [
    ["Menú y precios", "Tu menú, servicios o catálogo con categorías"],
    ["WiFi", "Tus clientes se conectan sin dictar la contraseña"],
    ["Pago / CLABE", "Datos bancarios con botón de copiar"],
    ["Plantillas", "18 diseños, tu logo, portada y colores"],
  ];
  return (
    <div className="rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-600/10 to-transparent p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-50">Estás en Básico. Esto se desbloquea con Pro:</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([t, d]) => (
              <li key={t} className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
                <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span>
                  <span className="block text-sm font-medium text-slate-200">{t}</span>
                  <span className="block text-xs text-slate-500">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <a
          href={whatsappLink(proMessage(tag.id))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500"
        >
          Desbloquear Pro · $100/mes
        </a>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Página
---------------------------------------------------------------- */
export default function NewDashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tags, setTags] = useState([]);
  const [scanDocs, setScanDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [pick, setPick] = useState(ALL);
  const [period, setPeriod] = useState(30);
  const [showClaim, setShowClaim] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [editorTab, setEditorTab] = useState("general");
  const [, setTick] = useState(0);
  const editorRef = useRef(null);

  const loadTags = useCallback(async (uid) => {
    const snap = await getDocs(query(collection(db, "tags"), where("owner_uid", "==", uid)));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => tagLabel(a).localeCompare(tagLabel(b), "es"));
    setTags(list);
    return list;
  }, []);

  const loadStats = useCallback(async (uid) => {
    setStatsError("");
    try {
      const snap = await getDocs(query(collection(db, "scan_days"), where("owner_uid", "==", uid)));
      setScanDocs(snap.docs.map((d) => d.data()));
    } catch (err) {
      console.error(err);
      setStatsError(err.code === "permission-denied" ? "Sin permiso para leer las estadísticas." : "No se pudieron cargar las estadísticas.");
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return; // el layout manda a /login
      setUser(u);
      setLoading(true);
      setError("");
      try {
        const [list] = await Promise.all([loadTags(u.uid), loadStats(u.uid)]);
        let saved = null;
        try {
          saved = localStorage.getItem(PICK_KEY);
        } catch {
          // sin almacenamiento: se queda en el valor por defecto
        }
        if (saved && (saved === ALL || list.some((t) => t.id === saved))) setPick(list.length > 1 ? saved : list[0]?.id || ALL);
        else setPick(list.length === 1 ? list[0].id : ALL);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar tus GT. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
      getDoc(doc(db, "users", u.uid))
        .then((s) => setProfile(s.exists() ? s.data() : null))
        .catch(() => {});
    });
    return () => unsub();
  }, [loadTags, loadStats]);

  // El estado «Abierto / Cerrado» se recalcula cada minuto
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const choose = (value) => {
    setPick(value);
    setEditorKey((k) => k + 1);
    setEditorTab("general");
    try {
      localStorage.setItem(PICK_KEY, value);
    } catch {
      // sin almacenamiento: no pasa nada
    }
  };

  const selected = pick === ALL ? null : tags.find((t) => t.id === pick) || null;
  const scope = selected ? [selected] : tags;
  // El editor siempre trabaja sobre un GT: el elegido o, en «Todos», el primero
  const editTag = selected || tags[0] || null;

  const paidScope = FREE_FULL_STATS ? scope : scope.filter((t) => tagIsPaid(t));
  const statsLocked = paidScope.length === 0;
  const lockIds = scope.map((t) => t.id).join(", ");

  const allStats = useMemo(() => periodStats(scanDocs, scope.map((t) => t.id), period), [scanDocs, scope, period]);
  const proStats = useMemo(
    () => periodStats(scanDocs, (statsLocked ? scope : paidScope).map((t) => t.id), period),
    [scanDocs, scope, paidScope, statsLocked, period]
  );

  const microInScope = scope.some((t) => t.mode !== "redirect");
  const periodLabel = period === 7 ? "vs. 7 días anteriores" : "vs. 30 días anteriores";

  // Encabezado: nombre y estado en vivo
  const headTag = selected || tags.find((t) => t.hours) || tags[0];
  const headName = selected ? selected.business_name || tagLabel(selected) : profile?.business_name || headTag?.business_name || "Mi negocio";
  const live = headTag?.mode !== "redirect" ? hoursStatus(headTag?.hours) : null;

  const reloadAll = async () => {
    if (!user) return;
    await loadTags(user.uid);
    setEditorKey((k) => k + 1);
  };

  const goToHours = () => {
    // Con «Todos» elegido, el horario se ajusta en el GT del encabezado
    if (headTag && (pick === ALL || headTag.id !== editTag?.id)) {
      setPick(headTag.id);
    }
    setEditorTab("general");
    setEditorKey((k) => k + 1);
    setTimeout(() => {
      (document.getElementById("horario") || editorRef.current)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const onClaimed = async (tagId) => {
    setShowClaim(false);
    const list = await loadTags(user.uid);
    if (list.some((t) => t.id === tagId)) choose(tagId);
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };

  if (loading) return <p className="text-sm text-slate-400">Cargando tu panel...</p>;

  const claimModal = showClaim && user && (
    <ClaimModal user={user} profile={profile} onClose={() => setShowClaim(false)} onClaimed={onClaimed} />
  );
  const claimButton = (
    <button
      onClick={() => setShowClaim(true)}
      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500"
    >
      + Vincular nuevo GT
    </button>
  );

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!tags.length) {
    return (
      <div>
        {claimModal}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-20 text-center">
          <LogoMark className="mb-5 h-14 w-14" />
          <h1 className="text-lg font-semibold text-slate-50">Aún no tienes GT vinculados</h1>
          <p className="mb-6 mt-2 max-w-sm text-sm text-slate-400">Usa el ID y el código de activación de la tarjeta que viene con tu stand.</p>
          {claimButton}
        </div>
        <Footer email={user?.email} />
      </div>
    );
  }

  const top = proStats.buttons[0];
  const topPrev = top ? proStats.prevClicks[top[0]] || 0 : 0;
  const share = nfcShare(proStats.via);
  const prevShare = nfcShare(proStats.prevVia);
  const otherVisits = proStats.via.otro || 0;
  const maxButton = proStats.buttons[0]?.[1] || 1;
  const redirectTags = scope.filter((t) => t.mode === "redirect");

  return (
    <div className="pb-6">
      {claimModal}

      <ExpiryRibbon tags={scope} />

      {/* 1. Encabezado rápido y selector de GT */}
      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">{headName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {live ? (
              <span className={`inline-flex items-center gap-2 font-medium ${live.open ? "text-emerald-400" : "text-red-400"}`}>
                <span className="relative flex h-2.5 w-2.5">
                  {live.open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${live.open ? "bg-emerald-400" : "bg-red-400"}`} />
                </span>
                {live.text}
              </span>
            ) : headTag?.mode === "redirect" ? (
              <span className="text-slate-400">Redirección directa: tus clientes van directo a tu link</span>
            ) : (
              <span className="text-slate-400">Sin horario: tus clientes no saben si estás abierto</span>
            )}
            {headTag?.mode !== "redirect" && (
              <button onClick={goToHours} className="text-brand-400 hover:text-brand-300 hover:underline">
                {live ? "Ajustar horario" : "Agregar horario"}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {tags.length > 1 && (
            <label className="relative">
              <span className="sr-only">Elegir GT</span>
              <select
                value={pick}
                onChange={(e) => choose(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 py-2 pl-3 pr-9 text-sm font-medium text-slate-50 outline-none transition focus:border-brand-500 sm:w-60"
              >
                <option value={ALL}>Todos mis GT ({tags.length}) · total</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {tagLabel(t)}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </label>
          )}
          {claimButton}
        </div>
      </section>

      {/* Periodo */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-300">
          {selected ? "Este GT" : tags.length > 1 ? `Todos tus GT` : "Tu GT"} · últimos {period} días
        </h2>
        <div className="flex rounded-lg border border-slate-800 bg-slate-900/60 p-0.5 text-xs font-medium">
          {[7, 30].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              className={`rounded-md px-3 py-1.5 transition ${period === p ? "bg-slate-700 text-slate-50" : "text-slate-400 hover:text-slate-200"}`}
            >
              {p} días
            </button>
          ))}
        </div>
      </div>

      {statsError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {statsError}
        </div>
      )}

      {/* 2. Las 3 métricas */}
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard title="Toques y escaneos">
          <p className="mt-2 text-4xl font-bold tabular-nums text-slate-50">{fmt(allStats.total)}</p>
          <p className="mt-1 text-sm text-slate-400">personas acercaron su celular o escanearon el QR</p>
          <Delta d={delta(allStats.total, allStats.prevTotal)} label={periodLabel} />
        </MetricCard>

        <MetricCard title="Canal de entrada" locked={statsLocked} lockIds={lockIds}>
          {share === null ? (
            <>
              <p className="mt-2 text-2xl font-bold text-slate-50">Midiendo…</p>
              <p className="mt-1 text-sm text-slate-400">
                {otherVisits ? `${fmt(otherVisits)} entraron por un link compartido.` : "Aparece con tus próximos toques."}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-50">
                {share}% <span className="text-lg font-semibold text-slate-400">NFC</span>
                <span className="mx-2 text-slate-600">·</span>
                {100 - share}% <span className="text-lg font-semibold text-slate-400">QR</span>
              </p>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="bg-brand-500" style={{ width: `${share}%` }} />
                <div className="bg-sky-400/70" style={{ width: `${100 - share}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {fmt(proStats.via.nfc)} con el chip · {fmt(proStats.via.qr)} con el QR
                {otherVisits ? ` · ${fmt(otherVisits)} por link` : ""}
              </p>
              {prevShare !== null && (
                <p className="mt-1 text-xs text-slate-500">
                  NFC antes: {prevShare}% ({share - prevShare >= 0 ? "+" : ""}
                  {share - prevShare} pts)
                </p>
              )}
            </>
          )}
        </MetricCard>

        <MetricCard title={microInScope ? "Botón estrella" : "Enlace activo"} locked={statsLocked && microInScope} lockIds={lockIds}>
          {microInScope ? (
            top ? (
              <>
                <p className="mt-2 truncate text-2xl font-bold text-slate-50" title={top[0]}>
                  {top[0]}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  <span className="font-semibold tabular-nums text-slate-200">{fmt(top[1])}</span> toques
                </p>
                <Delta d={delta(top[1], topPrev)} label={periodLabel} />
              </>
            ) : (
              <>
                <p className="mt-2 text-2xl font-bold text-slate-50">Sin clics aún</p>
                <p className="mt-1 text-sm text-slate-400">Aquí verás el botón que más tocan tus clientes.</p>
              </>
            )
          ) : (
            <>
              <p className="mt-2 truncate text-lg font-semibold text-brand-400" title={redirectTags[0]?.target_url}>
                {hasRealLink(redirectTags[0]) ? redirectTags[0].target_url.replace(/^https?:\/\/(www\.)?/, "") : "Sin link"}
              </p>
              <p className="mt-1 text-sm text-slate-400">Tus clientes van directo aquí, sin pantalla intermedia.</p>
              <button
                onClick={() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="mt-2 text-xs text-brand-400 hover:underline"
              >
                Cambiar link
              </button>
            </>
          )}
        </MetricCard>
      </section>

      {/* 3. Actividad diaria + clics por botón */}
      <section className="mb-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <MetricCard title="Actividad diaria" locked={statsLocked} lockIds={lockIds}>
          <div className="mb-4 mt-1">
            {proStats.bestDay !== null ? (
              <p className="text-sm text-slate-300">
                Tu mejor día: <span className="font-semibold capitalize text-slate-50">{weekdayName(proStats.bestDay)}</span>{" "}
                <span className="text-slate-500">(≈ {proStats.bestAvg.toFixed(proStats.bestAvg < 10 ? 1 : 0)} toques)</span>
              </p>
            ) : (
              <p className="text-sm text-slate-400">Cuando lleguen tus primeros toques verás qué días se mueve más tu negocio.</p>
            )}
          </div>
          <ActivityChart days={proStats.days} series={proStats.series} />
        </MetricCard>

        <MetricCard title="Clics por botón" locked={statsLocked && microInScope} lockIds={lockIds}>
          {!microInScope ? (
            <p className="mt-3 text-sm text-slate-400">En redirección directa no hay botones: todos van directo a tu link.</p>
          ) : proStats.buttons.length ? (
            <ul className="mt-3 space-y-3">
              {proStats.buttons.slice(0, 8).map(([label, n]) => (
                <li key={label}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-slate-200">{label}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-50">{fmt(n)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(4, (n / maxButton) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Todavía nadie ha tocado un botón en este periodo.</p>
          )}
        </MetricCard>
      </section>

      {/* 4a. Con «Todos» elegido: primero se escoge qué GT editar */}
      {!selected && tags.length > 1 && (
        <section ref={editorRef} id="gt-editor" className="scroll-mt-20">
          <h2 className="text-xl font-semibold text-slate-50">¿Cuál quieres editar?</h2>
          <p className="mt-0.5 text-sm text-slate-500">Arriba ves el total de tus {tags.length} GT. Para cambiar uno, elígelo aquí.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((t) => {
              const st = planStatus(t);
              const tagTotal = periodStats(scanDocs, [t.id], period).total;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => {
                      choose(t.id);
                      setTimeout(() => document.getElementById("gt-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
                    }}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left transition hover:border-brand-500/50 hover:bg-slate-900"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-50">{tagLabel(t)}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {t.mode === "redirect" ? "Redirección" : "Micrositio"} · {st.paid ? PLANS[st.plan].label : st.expired ? "Pro vencido" : "Básico"} · {fmt(tagTotal)} toques
                      </span>
                    </span>
                    <span className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition group-hover:border-brand-500 group-hover:text-slate-50">
                      Editar
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 4b. Editor + vista previa de un GT */}
      {editTag && (selected || tags.length === 1) && (
        <section ref={editorRef} id="gt-editor" className="scroll-mt-20 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">Editar {tagLabel(editTag)}</h2>
              {tags.length > 1 && (
                <button onClick={() => choose(ALL)} className="mt-0.5 text-xs text-slate-500 hover:text-slate-300 hover:underline">
                  ← Ver todos mis GT
                </button>
              )}
            </div>
            <a href={`/t/${editTag.id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-300 hover:text-slate-50 hover:underline">
              Probar mi GT ↗
            </a>
          </div>

          <ModeSwitch key={`mode-${editTag.id}-${editorKey}`} tag={editTag} onChanged={reloadAll} />

          {!tagIsPaid(editTag) && <ProShowcase tag={editTag} />}

          <TagEditor
            key={`ed-${editTag.id}-${editorKey}`}
            inline
            initialTab={editorTab}
            tag={editTag}
            onClose={() => setEditorKey((k) => k + 1)}
            onSaved={async () => {
              await loadTags(user.uid);
            }}
          />
        </section>
      )}

      <Footer email={user?.email} />
    </div>
  );
}

/* ---------------------------------------------------------------
   5. Pie limpio
---------------------------------------------------------------- */
function Footer({ email }) {
  return (
    <footer className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-6 sm:flex-row">
      <div className="flex items-center gap-4 text-sm">
        <SuggestButton variant="link" label="¿Falta algo? Sugerir" context={`Panel nuevo (${email || "sin correo"})`} />
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 hover:underline">
          Panel clásico
        </Link>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        Modo claro / oscuro
        <ThemeToggle />
      </div>
    </footer>
  );
}
