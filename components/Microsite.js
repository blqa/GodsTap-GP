"use client";

import { memo, useEffect, useRef, useState } from "react";
import LinkIcon from "@/components/LinkIcon";
import MicrositeFx from "@/components/MicrositeFx";
import { kindOf } from "@/lib/linkIcons";
import { buildVCard, cleanDigits, formatCard, formatClabe, linkHref } from "@/lib/linkActions";
import { cleanMenu, countItems, formatPrice } from "@/lib/menu";
import { alpha, fontStack, getSafeUrl, normalizeTheme, shapeRadius, textOn } from "@/lib/microsite";
import { isStoredImage } from "@/lib/images";

function Microsite({ name, tagline, mainUrl, links, menu, theme, logo, cover, preview = false, hideBrand = false }) {
  const t = normalizeTheme(theme);
  const fg = textOn(t.bg);
  const onAccent = textOn(t.accent);

  const businessName = String(name || "").trim() || "Negocio";
  const initial = businessName.charAt(0).toUpperCase() || "G";
  const main = getSafeUrl(mainUrl);
  const slogan = String(tagline || "").trim().slice(0, 90);
  const cleanedMenu = cleanMenu(menu);
  const logoSrc = isStoredImage(logo, "logo") ? logo : null;
  const coverSrc = isStoredImage(cover, "cover") ? cover : null;
  const rad = shapeRadius(t.shape);
  const panelRad = rad > 100 ? 24 : rad;
  const chipRad = t.shape === "square" ? 6 : t.shape === "pill" ? 999 : 12;
  const avatarRad = t.shape === "square" ? "28%" : "50%";

  // En el celular, al jalar la página hacia arriba o abajo se ve el fondo de atrás del navegador.
  // Se pinta con el color de este micrositio (y la barra de Safari también) para que no se note.
  useEffect(() => {
    if (preview) return undefined;
    const root = document.documentElement;
    const body = document.body;
    const before = { root: root.style.backgroundColor, body: body.style.backgroundColor, ob: root.style.overscrollBehaviorY };
    root.style.backgroundColor = t.bg;
    body.style.backgroundColor = t.bg;
    root.style.overscrollBehaviorY = "none";

    let meta = document.querySelector('meta[name="theme-color"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    const beforeColor = meta.content;
    meta.content = t.bg;

    return () => {
      root.style.backgroundColor = before.root;
      body.style.backgroundColor = before.body;
      root.style.overscrollBehaviorY = before.ob;
      if (created) meta.remove();
      else meta.content = beforeColor;
    };
  }, [preview, t.bg]);

  // Barra fija con el logo, el nombre y la frase: aparece cuando el encabezado grande sale de la pantalla
  const heroRef = useRef(null);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    // En la vista previa (un "celular" con su propio scroll) se mide contra ese celular, no contra toda la página
    const root = preview ? rootRef.current?.parentElement || null : null;
    const io = new IntersectionObserver(([entry]) => setPinned(!entry.isIntersecting), { root, rootMargin: "-56px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [preview]);

  const [openWifi, setOpenWifi] = useState(null);
  const [copied, setCopied] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  // En la vista previa (editor y página principal) el menú se abre sobre lo que se ve del "celular", no sobre toda la página
  const rootRef = useRef(null);
  const [sheetBox, setSheetBox] = useState(null);
  const openMenu = () => {
    if (preview) {
      const sc = rootRef.current?.parentElement;
      if (sc) setSheetBox({ top: sc.scrollTop, height: sc.clientHeight });
    }
    setMenuOpen(true);
  };
  useEffect(() => {
    if (!preview || !menuOpen) return undefined;
    const sc = rootRef.current?.parentElement;
    if (!sc) return undefined;
    const before = sc.style.overflowY;
    sc.style.overflowY = "hidden";
    return () => {
      sc.style.overflowY = before;
    };
  }, [preview, menuOpen]);

  // Solo se muestran botones con texto y datos válidos (enlaces http/https, teléfono, correo, contacto o WiFi)
  const extra = (Array.isArray(links) ? links : [])
    .map((l) => {
      const kind = kindOf(l?.icon);
      const data = l?.data && typeof l.data === "object" ? l.data : {};
      // «Pago» puede ser un enlace (Mercado Pago, PayPal…) o datos para transferencia
      const effKind = kind === "pay" ? (data.mode === "bank" ? "bank" : "url") : kind;
      return {
        label: String(l?.label || "").slice(0, 40),
        icon: l?.icon,
        kind: effKind,
        url: ["contact", "wifi", "bank"].includes(effKind) ? null : linkHref(l),
        data,
      };
    })
    .filter((l) => {
      if (!l.label) return false;
      if (l.kind === "contact") return !!String(l.data.name || "").trim();
      if (l.kind === "wifi") return !!String(l.data.ssid || "").trim();
      if (l.kind === "bank") return !!(cleanDigits(l.data.clabe) || cleanDigits(l.data.account) || cleanDigits(l.data.card));
      return !!l.url;
    })
    .slice(0, 6);

  // En la vista previa los botones no navegan
  const onClick = preview ? (e) => e.preventDefault() : undefined;

  const saveContact = (l) => {
    if (preview) return;
    try {
      const vcf = buildVCard({
        name: String(l.data.name || "").slice(0, 60),
        phone: l.data.phone,
        email: l.data.email,
        org: businessName,
      });
      const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${String(l.data.name || "contacto").replace(/[^\w\- ]+/g, "").trim() || "contacto"}.vcf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const copyText = async (key, value) => {
    if (preview) return;
    try {
      await navigator.clipboard.writeText(String(value || ""));
      setCopied(key);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      // sin permiso del portapapeles: la persona puede copiarlo a mano
    }
  };

  // Estilos compartidos por los botones
  const glass = {
    backgroundColor: alpha(fg, 0.07),
    border: `1px solid ${alpha(fg, 0.16)}`,
    color: fg,
    borderRadius: rad,
  };
  const rowClass =
    "ms-in group flex w-full items-center gap-3.5 px-4 py-3 text-left text-[15px] font-medium transition active:scale-[0.98] hover:brightness-110";
  const chip = { backgroundColor: alpha(t.accent, 0.22), color: t.accent };
  const chipOnLight = brightnessLight(t.bg) ? { backgroundColor: alpha(t.accent, 0.16), color: t.accent } : chip;

  const rowInner = (icon, label, end) => (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center" style={{ ...chipOnLight, borderRadius: chipRad }}>
        <LinkIcon name={icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span style={{ color: alpha(fg, 0.45) }}>{end}</span>
    </>
  );

  let step = 0;
  const delay = () => ({ "--i": step++ });

  return (
    <main
      ref={rootRef}
      className={`relative flex justify-center px-5 ${preview ? "min-h-full" : "min-h-dvh"} ${
        coverSrc ? "pb-12 pt-0" : preview ? "py-10" : "py-12"
      }`}
      style={{ backgroundColor: t.bg, color: fg, fontFamily: fontStack(t.font) }}
    >
      {/* Los brillos de fondo van en su propia capa recortada (así la barra fija sí puede "pegarse" arriba) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <MicrositeFx style={t.fx} accent={t.accent} fg={fg} preview={preview} />
        {/* Degradados radiales (sin filtro de desenfoque): evitan manchas o recuadros de otro color en iPhone */}
        <div
          className={`absolute -top-72 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 ${coverSrc ? "opacity-40" : ""}`}
          style={{ background: `radial-gradient(closest-side, ${alpha(t.accent, 0.3)}, ${alpha(t.accent, 0.12)} 55%, ${alpha(t.accent, 0)})` }}
        />
        <div
          className="absolute -bottom-56 -right-40 h-[32rem] w-[32rem]"
          style={{ background: `radial-gradient(closest-side, ${alpha(t.accent, 0.16)}, ${alpha(t.accent, 0)})` }}
        />
      </div>

      <div className="relative flex w-full max-w-sm flex-col text-center">
        {/* Barra fija: logo + nombre + frase siempre a la vista al bajar */}
        <div className="sticky top-0 z-30 h-0">
          <div
            className={`pointer-events-none absolute -inset-x-5 top-0 h-20 transition-opacity duration-300 ${pinned ? "opacity-100" : "opacity-0"}`}
            style={{ background: `linear-gradient(to bottom, ${t.bg} 55%, ${alpha(t.bg, 0)})` }}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => heroRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            tabIndex={pinned ? 0 : -1}
            aria-hidden={!pinned}
            aria-label="Volver al inicio"
            className={`absolute inset-x-0 flex items-center gap-3 px-3 py-2 text-left transition duration-300 ${
              pinned ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
            }`}
            style={{
              top: "max(0.5rem, env(safe-area-inset-top))",
              borderRadius: Math.min(rad, 24),
              backgroundColor: alpha(t.bg, 0.96),
              border: `1px solid ${alpha(fg, 0.14)}`,
              boxShadow: `0 10px 30px -12px ${alpha("#000000", 0.45)}`,
              color: fg,
            }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden text-lg font-bold"
              style={{
                borderRadius: avatarRad,
                ...(logoSrc
                  ? { backgroundColor: alpha(fg, 0.1) }
                  : { background: `linear-gradient(145deg, ${t.accent}, ${alpha(t.accent, 0.72)})`, color: onAccent }),
              }}
            >
              {logoSrc ? <img src={logoSrc} alt="" className="h-full w-full object-cover" /> : initial}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold leading-tight">{businessName}</span>
              {slogan && (
                <span className="block truncate text-xs" style={{ color: alpha(fg, 0.65) }}>
                  {slogan}
                </span>
              )}
            </span>
          </button>
        </div>

        {coverSrc && (
          <div className="ms-in relative -mx-5 overflow-hidden" style={{ aspectRatio: "1000 / 420", ...delay() }}>
            <img src={coverSrc} alt="" className="h-full w-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(to bottom, ${alpha(t.bg, 0)} 45%, ${alpha(t.bg, 0.85)} 85%, ${t.bg})` }}
            />
          </div>
        )}

        <div className={`w-full ${coverSrc ? "-mt-12" : "my-auto"}`}>
          <div
            ref={heroRef}
            className="ms-in relative mx-auto mb-5 flex h-24 w-24 items-center justify-center overflow-hidden text-4xl font-bold"
            style={{
              ...delay(),
              borderRadius: avatarRad,
              ...(logoSrc
                ? { backgroundColor: coverSrc ? t.bg : alpha(fg, 0.1) }
                : { background: `linear-gradient(145deg, ${t.accent}, ${alpha(t.accent, 0.72)})`, color: onAccent }),
              boxShadow: coverSrc
                ? `0 0 0 4px ${t.bg}, 0 0 0 6px ${alpha(t.accent, 0.55)}, 0 18px 40px -14px ${alpha(t.accent, 0.6)}`
                : `0 0 0 3px ${alpha(t.accent, 0.4)}, 0 0 0 7px ${alpha(t.accent, 0.14)}, 0 18px 40px -14px ${alpha(t.accent, 0.6)}`,
            }}
          >
            {logoSrc ? <img src={logoSrc} alt="" className="h-full w-full object-cover" /> : initial}
          </div>

          <h1 className="ms-in break-words text-[1.7rem] font-semibold leading-tight tracking-tight" style={delay()}>
            {businessName}
          </h1>
          <p className="ms-in mx-auto mt-2 max-w-[18rem] text-sm leading-relaxed" style={{ ...delay(), color: alpha(fg, 0.68) }}>
            {slogan || "Toca una opción para continuar"}
          </p>

          <div className="mt-8 space-y-3">
            {cleanedMenu && (
              <button
                type="button"
                onClick={openMenu}
                className="ms-in flex w-full items-center justify-center gap-2.5 px-6 py-4 text-base font-semibold transition active:scale-[0.98] hover:brightness-110"
                style={{
                  ...delay(),
                  borderRadius: rad,
                  backgroundColor: t.accent,
                  color: onAccent,
                  boxShadow: `0 14px 30px -14px ${alpha(t.accent, 0.9)}`,
                }}
              >
                <LinkIcon name="book" className="h-5 w-5" />
                {cleanedMenu.label || "Ver menú"}
                <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: alpha(onAccent, 0.18) }}>
                  {countItems(cleanedMenu)}
                </span>
              </button>
            )}

            {main &&
              (cleanedMenu ? (
                <a
                  href={main}
                  onClick={onClick}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={rowClass}
                  style={{ ...glass, ...delay() }}
                >
                  {rowInner("web", "Visitar sitio", <LinkIcon name="chevron" className="h-4 w-4" strokeWidth={2} />)}
                </a>
              ) : (
                <a
                  href={main}
                  onClick={onClick}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ms-in flex w-full items-center justify-center gap-2 px-6 py-4 text-base font-semibold transition active:scale-[0.98] hover:brightness-110"
                  style={{
                    ...delay(),
                    borderRadius: rad,
                    backgroundColor: t.accent,
                    color: onAccent,
                    boxShadow: `0 14px 30px -14px ${alpha(t.accent, 0.9)}`,
                  }}
                >
                  Visitar sitio
                  <LinkIcon name="chevron" className="h-5 w-5" strokeWidth={2.2} />
                </a>
              ))}

            {extra.map((l, i) => {
              if (l.kind === "contact") {
                return (
                  <button key={i} type="button" onClick={() => saveContact(l)} className={rowClass} style={{ ...glass, ...delay() }}>
                    {rowInner(l.icon, l.label, <LinkIcon name="download" className="h-4 w-4" />)}
                  </button>
                );
              }
              if (l.kind === "wifi" || l.kind === "bank") {
                const open = openWifi === i;
                const d = l.data;
                const rows =
                  l.kind === "wifi"
                    ? [
                        ["Red", d.ssid, d.ssid],
                        ["Contraseña", d.password, d.password],
                      ]
                    : [
                        ["Banco", d.bank, d.bank],
                        ["A nombre de", d.holder, d.holder],
                        ["CLABE", d.clabe && formatClabe(d.clabe), cleanDigits(d.clabe)],
                        ["Cuenta", d.account, cleanDigits(d.account)],
                        ["Tarjeta", d.card && formatCard(d.card), cleanDigits(d.card)],
                        ["Concepto", d.reference, d.reference],
                      ];
                return (
                  <div key={i}>
                    <button
                      type="button"
                      onClick={() => setOpenWifi(open ? null : i)}
                      aria-expanded={open}
                      className={rowClass}
                      style={{ ...glass, ...delay() }}
                    >
                      {rowInner(l.icon, l.label, <LinkIcon name={open ? "minus" : "plus"} className="h-4 w-4" />)}
                    </button>
                    {open && (
                      <div className="mt-2 space-y-3 p-4 text-left text-sm" style={{ ...glass, borderRadius: panelRad }}>
                        {rows
                          .filter(([, shown]) => shown)
                          .map(([label2, shown, raw], k) => {
                            const copyable = !["Banco", "A nombre de"].includes(label2);
                            return (
                              <div key={k} className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-xs" style={{ color: alpha(fg, 0.55) }}>
                                    {label2}
                                  </p>
                                  <p className={`break-all text-[15px] ${copyable ? "font-mono" : ""}`}>{shown}</p>
                                </div>
                                {copyable && (
                                  <button
                                    type="button"
                                    onClick={() => copyText(`${i}-${k}`, raw)}
                                    className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
                                    style={{ backgroundColor: t.accent, color: onAccent }}
                                  >
                                    {copied === `${i}-${k}` ? "Copiado" : "Copiar"}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              }
              const web = l.url.startsWith("http");
              return (
                <a
                  key={i}
                  href={l.url}
                  onClick={onClick}
                  {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={rowClass}
                  style={{ ...glass, ...delay() }}
                >
                  {rowInner(l.icon, l.label, <LinkIcon name="chevron" className="h-4 w-4" strokeWidth={2} />)}
                </a>
              );
            })}
          </div>

          {!main && extra.length === 0 && !cleanedMenu && (
            <p className="mt-8 rounded-xl px-4 py-3 text-sm" style={{ border: `1px solid ${alpha(fg, 0.18)}`, color: alpha(fg, 0.65) }}>
              Este enlace aún no está configurado.
            </p>
          )}
        </div>

        {!hideBrand && (
          <p className="ms-in mt-12 text-xs" style={{ ...delay(), color: alpha(fg, 0.42) }}>
            <a href="/" onClick={onClick} className="inline-block px-2 py-1 transition hover:opacity-80" aria-label="GodsTap · by God’s Plan, ir a la página principal">
              <span className="font-medium">GodsTap</span> · by God’s Plan
            </a>
          </p>
        )}
      </div>

      {menuOpen && cleanedMenu && (
        <MenuSheet
          menu={cleanedMenu}
          name={businessName}
          theme={t}
          fg={fg}
          onAccent={onAccent}
          preview={preview}
          box={sheetBox}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </main>
  );
}

function brightnessLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

// Hoja con el menú: categorías arriba (chips) y platillos con su precio
export function MenuSheet({ menu, name, theme: t, fg, onAccent, preview, box, onClose }) {
  // «Ver servicios» → «Servicios»; sin texto personalizado → «Menú»
  const sheetTitle = menu.label ? menu.label.replace(/^ver\s+/i, "").replace(/^./, (c) => c.toUpperCase()) : "Menú";
  const scroller = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (preview) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [preview, onClose]);

  const goTo = (i) => {
    const box = scroller.current;
    const el = box?.querySelector(`[data-sec="${i}"]`);
    if (!box || !el) return;
    box.scrollTo({ top: el.offsetTop - 118, behavior: "smooth" });
    setActive(i);
  };

  const onScroll = () => {
    const box = scroller.current;
    if (!box) return;
    let idx = 0;
    box.querySelectorAll("[data-sec]").forEach((el, i) => {
      if (el.offsetTop - 130 <= box.scrollTop) idx = i;
    });
    setActive(idx);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${sheetTitle} de ${name}`}
      className={`${preview ? "absolute inset-x-0" : "fixed inset-0"} z-40 flex flex-col ${preview && !box ? "inset-y-0" : ""}`}
      style={{
        backgroundColor: t.bg,
        color: fg,
        fontFamily: fontStack(t.font),
        ...(preview && box ? { top: box.top, height: box.height } : null),
      }}
    >
      <div className="relative shrink-0 px-5 pb-3 pt-4" style={{ borderBottom: `1px solid ${alpha(fg, 0.12)}`, backgroundColor: alpha(t.bg, 0.96) }}>
        <div className="mx-auto flex w-full max-w-sm items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-95"
            style={{ backgroundColor: alpha(fg, 0.1) }}
          >
            <LinkIcon name="back" className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-tight">{name}</p>
            <p className="text-xs" style={{ color: alpha(fg, 0.6) }}>{sheetTitle}</p>
          </div>
        </div>
        {menu.sections.length > 1 && (
          <div className="mx-auto mt-3 flex w-full max-w-sm gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {menu.sections.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition"
                style={
                  active === i
                    ? { backgroundColor: t.accent, color: onAccent }
                    : { backgroundColor: alpha(fg, 0.08), color: alpha(fg, 0.8) }
                }
              >
                {s.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={scroller} onScroll={onScroll} className="relative flex-1 overflow-y-auto overscroll-contain px-5 pb-16 pt-5">
        <div className="mx-auto w-full max-w-sm">
          {menu.sections.map((s, i) => (
            <section key={i} data-sec={i} className="mb-8">
              <h2 className="mb-3 text-lg font-semibold tracking-tight" style={{ color: t.accent }}>
                {s.title}
              </h2>
              <ul className="space-y-4">
                {s.items.map((it, j) => (
                  <li key={j}>
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium leading-snug">{it.name}</span>
                      {it.price && <span className="mb-1 min-w-4 flex-1 self-end border-b border-dotted" style={{ borderColor: alpha(fg, 0.28) }} />}
                      {it.price && <span className="shrink-0 font-semibold tabular-nums">{formatPrice(it.price)}</span>}
                    </div>
                    {it.desc && (
                      <p className="mt-0.5 text-sm leading-snug" style={{ color: alpha(fg, 0.62) }}>
                        {it.desc}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {menu.note && (
            <p className="rounded-xl px-4 py-3 text-sm" style={{ border: `1px solid ${alpha(fg, 0.15)}`, color: alpha(fg, 0.7) }}>
              {menu.note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Memoizado: al escribir en otros campos del editor, la vista previa no se vuelve a calcular
export default memo(Microsite);
