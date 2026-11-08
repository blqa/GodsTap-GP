"use client";

import { useState } from "react";
import { deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { kindOf } from "@/lib/linkIcons";
import { cleanDigits, isValidClabe, isValidEmail, isValidPhone, normalizePhone, stripScheme } from "@/lib/linkActions";
import { brightness, normalizeTheme, themeForSave } from "@/lib/microsite";
import { isStoredImage } from "@/lib/images";
import { PLANS, formatDate, planStatus, tagIsPaid, tagShowBrand } from "@/lib/plans";
import { whatsappLink } from "@/lib/contact";
import { logEvent } from "@/lib/audit";
import Microsite from "@/components/Microsite";
import MenuEditor from "@/components/dashboard/MenuEditor";
import LinksEditor, { MAX_LINKS } from "@/components/dashboard/editor/LinksEditor";
import DesignEditor from "@/components/dashboard/editor/DesignEditor";
import { cleanMenu } from "@/lib/menu";

const EMPTY_LINKS = [];

const TABS = [
  ["general", "General"],
  ["design", "Diseño"],
  ["links", "Botones"],
  ["menu", "Menú"],
];

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

function isValidUrl(url) {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

function Locked({ title, tagId, children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-4">
      <div className="flex items-center gap-2">
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v7a2 2 0 002 2h8a2 2 0 002-2V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clipRule="evenodd" /></svg>
        <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
        <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs text-brand-300 ring-1 ring-brand-500/30">
          Pro
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400">{children}</p>
      <a
        href={whatsappLink("Hola, quiero el plan Pro de GodsTap para mi GT " + tagId)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm text-brand-400 hover:underline"
      >
        Pedir el plan Pro
      </a>
    </div>
  );
}

// admin: el administrador puede editar todo, aunque el plan del GT no lo incluya
export default function TagEditor({ tag, onClose, onSaved, admin = false }) {
  const paid = admin || tagIsPaid(tag);
  const status = planStatus(tag);

  const [name, setName] = useState(tag.business_name || "");
  const [mode, setMode] = useState(tag.mode === "redirect" ? "redirect" : "microsite");
  const [url, setUrl] = useState(tag.target_url || "");
  const [nickname, setNickname] = useState(tag.nickname || "");  
  const [theme, setTheme] = useState(normalizeTheme(tag.theme));
  const [links, setLinks] = useState(
    Array.isArray(tag.links)
      ? tag.links.map((l) => ({
          label: l?.label || "",
          url: ["phone", "email"].includes(kindOf(l?.icon)) ? stripScheme(l?.url) : l?.url || "",
          icon: l?.icon || "link",
          data: l?.data && typeof l.data === "object" ? l.data : {},
        }))
      : []
  );
  const [tagline, setTagline] = useState(tag.tagline || "");
  const [menu, setMenu] = useState({
    sections: Array.isArray(tag.menu?.sections)
      ? tag.menu.sections.map((s) => ({
          title: s?.title || "",
          items: Array.isArray(s?.items)
            ? s.items.map((it) => ({ name: it?.name || "", price: it?.price || "", desc: it?.desc || "" }))
            : [],
        }))
      : [],
    note: tag.menu?.note || "",
    label: tag.menu?.label || "",
  });
  const [logo, setLogo] = useState(typeof tag.logo === "string" ? tag.logo : "");
  const [cover, setCover] = useState(typeof tag.cover === "string" ? tag.cover : "");
  const [tab, setTab] = useState("general");
  const [view, setView] = useState("edit"); // en celular: «edit» o «preview»
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const lowContrast = Math.abs(brightness(theme.bg) - brightness(theme.accent)) < 45;

  const fail = (msg, where = "general") => {
    setError(msg);
    setTab(where);
    setView("edit");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanUrl = url.trim();

    if (!cleanName || cleanName.length > 80) {
      fail("El nombre es obligatorio (máximo 80 caracteres).");
      return;
    }
    if (!isValidUrl(cleanUrl)) {
      fail("El enlace principal debe empezar con http:// o https://");
      return;
    }

    const cleanTagline = tagline.trim();
    if (cleanTagline.length > 90) {
      fail("La frase debajo del nombre puede tener máximo 90 caracteres.");
      return;
    }

    const cleanNick = nickname.trim();
    if (cleanNick.length > 40) {
      fail("El nombre de tu GT puede tener máximo 40 caracteres.");
      return;
    }

    const payload = {
      nickname: cleanNick,
      business_name: cleanName,
      mode,
      target_url: cleanUrl,
      tagline: cleanTagline,
      updated_at: serverTimestamp(),
    };

    // Botones y colores solo se guardan en planes de pago
    if (paid) {
      const cleanLinks = [];
      for (let i = 0; i < links.length; i++) {
        const l = links[i];
        const kind = kindOf(l.icon);
        const label = l.label.trim();
        const raw = (l.url || "").trim();
        const d = l.data || {};
        const empty = !label && !raw && !(d.name || d.phone || d.email || d.ssid || d.password || d.bank || d.holder || d.clabe || d.account || d.card || d.reference);
        if (empty) continue; // fila vacía: se ignora
        if (!label || label.length > 30) {
          fail(`Botón ${i + 1}: escribe un texto (máximo 30 caracteres).`, "links");
          return;
        }
        const item = { label, icon: l.icon, url: "" };
        if (kind === "url") {
          if (!isValidUrl(raw)) {
            fail(`Botón ${i + 1}: el enlace debe empezar con http:// o https://`, "links");
            return;
          }
          item.url = raw;
        } else if (kind === "phone") {
          const p = normalizePhone(raw);
          if (!isValidPhone(p)) {
            fail(`Botón ${i + 1}: escribe un teléfono válido (10 dígitos).`, "links");
            return;
          }
          item.url = `${l.icon === "sms" ? "sms" : "tel"}:${p}`;
        } else if (kind === "email") {
          if (!isValidEmail(raw)) {
            fail(`Botón ${i + 1}: escribe un correo válido.`, "links");
            return;
          }
          item.url = `mailto:${raw}`;
        } else if (kind === "contact") {
          const cname = (d.name || "").trim().slice(0, 60);
          const cphone = (d.phone || "").trim() ? normalizePhone(d.phone) : "";
          const cemail = (d.email || "").trim();
          if (!cname) {
            fail(`Botón ${i + 1}: escribe el nombre del contacto.`, "links");
            return;
          }
          if (!cphone && !cemail) {
            fail(`Botón ${i + 1}: agrega un teléfono o un correo al contacto.`, "links");
            return;
          }
          if (cphone && !isValidPhone(cphone)) {
            fail(`Botón ${i + 1}: el teléfono del contacto no es válido.`, "links");
            return;
          }
          if (cemail && !isValidEmail(cemail)) {
            fail(`Botón ${i + 1}: el correo del contacto no es válido.`, "links");
            return;
          }
          item.data = { name: cname, ...(cphone ? { phone: cphone } : {}), ...(cemail ? { email: cemail } : {}) };
        } else if (kind === "pay") {
          if (d.mode === "bank") {
            const bank = (d.bank || "").trim();
            const holder = (d.holder || "").trim();
            const clabe = cleanDigits(d.clabe);
            const account = cleanDigits(d.account);
            const card = cleanDigits(d.card);
            const reference = (d.reference || "").trim();
            if (!bank || bank.length > 40) {
              fail(`Botón ${i + 1}: escribe el banco (máximo 40 caracteres).`, "links");
              return;
            }
            if (!holder || holder.length > 60) {
              fail(`Botón ${i + 1}: escribe a nombre de quién está la cuenta.`, "links");
              return;
            }
            if (!isValidClabe(clabe)) {
              fail(`Botón ${i + 1}: la CLABE debe tener 18 dígitos y ser válida. Revísala.`, "links");
              return;
            }
            if (account && (account.length < 8 || account.length > 16)) {
              fail(`Botón ${i + 1}: el número de cuenta debe tener entre 8 y 16 dígitos.`, "links");
              return;
            }
            if (card && card.length !== 16) {
              fail(`Botón ${i + 1}: el número de tarjeta debe tener 16 dígitos.`, "links");
              return;
            }
            if (reference.length > 40) {
              fail(`Botón ${i + 1}: el concepto es muy largo (máximo 40 caracteres).`, "links");
              return;
            }
            item.data = {
              mode: "bank",
              bank,
              holder,
              clabe,
              ...(account ? { account } : {}),
              ...(card ? { card } : {}),
              ...(reference ? { reference } : {}),
            };
          } else {
            if (!isValidUrl(raw)) {
              fail(`Botón ${i + 1}: el enlace de pago debe empezar con http:// o https://`, "links");
              return;
            }
            item.url = raw;
          }
        } else if (kind === "wifi") {
          const ssid = (d.ssid || "").trim();
          const pass = (d.password || "").trim();
          if (!ssid || ssid.length > 32) {
            fail(`Botón ${i + 1}: escribe el nombre de la red (máximo 32 caracteres).`, "links");
            return;
          }
          if (pass.length > 63) {
            fail(`Botón ${i + 1}: la contraseña del WiFi es muy larga.`, "links");
            return;
          }
          item.data = { ssid, ...(pass ? { password: pass } : {}) };
        }
        cleanLinks.push(item);
      }
      payload.links = cleanLinks;
      payload.theme = themeForSave(theme);

      if (logo && !isStoredImage(logo, "logo")) {
        fail("El logo no es válido. Súbelo de nuevo.", "design");
        return;
      }
      if (cover && !isStoredImage(cover, "cover")) {
        fail("La portada no es válida. Súbela de nuevo.", "design");
        return;
      }
      if (logo) payload.logo = logo;
      else if (tag.logo) payload.logo = deleteField();
      if (cover) payload.cover = cover;
      else if (tag.cover) payload.cover = deleteField();

      const cleanedMenu = cleanMenu(menu);
      if (cleanedMenu) payload.menu = cleanedMenu;
      else if (tag.menu) payload.menu = deleteField();
    }

    // Qué cambió (para el registro de movimientos)
    const changed = [];
    if (cleanName !== (tag.business_name || "")) changed.push("nombre del negocio");
    if (cleanNick !== (tag.nickname || "")) changed.push("alias");
    if (mode !== (tag.mode === "redirect" ? "redirect" : "microsite")) changed.push("modo");
    if (cleanUrl !== (tag.target_url || "")) changed.push("enlace principal");
    if (payload.links && JSON.stringify(payload.links) !== JSON.stringify(tag.links || [])) changed.push("botones");
    if (cleanTagline !== (tag.tagline || "")) changed.push("frase");
    if (paid && JSON.stringify(cleanMenu(menu)) !== JSON.stringify(cleanMenu(tag.menu))) changed.push("menú");
    if (paid && logo !== (tag.logo || "")) changed.push("logo");
    if (paid && cover !== (tag.cover || "")) changed.push("portada");
    if (payload.theme && JSON.stringify(payload.theme) !== JSON.stringify(themeForSave(tag.theme))) changed.push("diseño");

    setSaving(true);
    try {
      await updateDoc(doc(db, "tags", tag.id), payload);
      await logEvent({
        action: admin ? "tag_updated_by_admin" : "tag_updated",
        owner_uid: tag.owner_uid || "",
        tag_id: tag.id,
        business_name: cleanName,
        summary: changed.length ? `Cambió: ${changed.join(", ")}.` : "Guardó sin cambios.",
      });
      await onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(`No se pudo guardar. Inténtalo de nuevo.${err?.code ? ` (${err.code})` : ""}`);
      setSaving(false);
    }
  };

  const isMicro = mode === "microsite";
  const tabs = isMicro ? TABS : TABS.slice(0, 1);
  const tabBtn = (active) =>
    `shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
      active ? "border-brand-500 text-slate-50" : "border-transparent text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSave}
        className="mx-auto my-4 w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl sm:my-6"
      >
        <div className="p-4 pb-3 sm:p-6 sm:pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-50">
                Editar GT <span className="font-mono text-sm text-slate-400">{tag.id}</span>
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                  paid
                    ? "bg-brand-500/10 text-brand-300 ring-brand-500/30"
                    : "bg-slate-500/10 text-slate-400 ring-slate-500/30"
                }`}
              >
                {status.expired
                  ? `Plan ${PLANS[status.plan].label} vencido el ${formatDate(status.until)}`
                  : `Plan ${PLANS[status.plan].label}${status.until ? ` · vence el ${formatDate(status.until)}` : ""}`}
              </span>
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-500 hover:text-slate-50">
              ✕
            </button>
          </div>

          {admin && (
            <p className="mt-4 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-300">
              Modo administrador: puedes editar todo. Lo de diseño, botones y menú solo se muestra al público si el GT tiene un plan de pago vigente.
            </p>
          )}
        </div>

        {/* Barra fija: en celular alterna entre editar y ver la vista previa; las pestañas dividen el editor en partes cortas */}
        <div className="sticky top-0 z-20 border-y border-slate-800 bg-slate-900 px-4 sm:px-6">
          {isMicro && (
            <div className="grid grid-cols-2 gap-1 pt-2 lg:hidden">
              {[
                ["edit", "Editar"],
                ["preview", "Vista previa"],
              ].map(([v, text]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`rounded-lg py-1.5 text-sm font-medium transition ${
                    view === v ? "bg-slate-700 text-slate-50" : "bg-slate-800/60 text-slate-400"
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          )}
          <div className={`flex gap-1 overflow-x-auto [scrollbar-width:none] ${view === "preview" ? "hidden lg:flex" : ""}`}>
            {tabs.map(([key, text]) => (
              <button key={key} type="button" onClick={() => setTab(key)} aria-current={tab === key} className={tabBtn(tab === key)}>
                {text}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 p-4 sm:p-6 lg:grid-cols-[1fr_340px]">
          {/* Columna izquierda: formulario por pestañas */}
          <div className={`min-w-0 space-y-5 ${view === "preview" ? "hidden lg:block" : ""}`}>
            {tab === "general" && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre de este GT</label>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={40}
                    placeholder="Ej. Mostrador, Mesa 3, Sucursal Centro"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Es para que tú los distingas. No aparece en tu micrositio y no cambia el link del chip ({tag.id}).
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre del negocio</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">Modo</label>
                    <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
                      <option value="microsite">Micrositio</option>
                      <option value="redirect">Redirección directa</option>
                    </select>
                  </div>
                  {mode === "microsite" && (
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Frase debajo del nombre (opcional)</label>
                      <input
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        maxLength={90}
                        placeholder="Ej. Café de especialidad · Abierto de 8 a 20 h"
                        className={inputClass}
                      />
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                      {mode === "microsite" ? "Enlace principal (botón destacado)" : "Enlace de destino"}
                    </label>
                    <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={inputClass} />
                  </div>
                </div>

                {mode === "redirect" && (
                  <p className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-500">
                    En modo redirección no se muestra ninguna página: el cliente va directo al enlace.
                  </p>
                )}
                {isMicro && paid && (
                  <p className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-500">
                    Para el logo, la portada, los colores, los botones y el menú usa las pestañas de arriba.
                  </p>
                )}
              </>
            )}

            {isMicro && tab === "design" &&
              (paid ? (
                <DesignEditor
                  theme={theme}
                  setTheme={setTheme}
                  logo={logo}
                  setLogo={setLogo}
                  cover={cover}
                  setCover={setCover}
                  lowContrast={lowContrast}
                />
              ) : (
                <Locked title="Diseño personalizado" tagId={tag.id}>
                  Plantillas, logo de tu negocio, foto de portada, colores, tipo de letra y animación de fondo.
                </Locked>
              ))}

            {isMicro && tab === "links" &&
              (paid ? (
                <LinksEditor links={links} setLinks={setLinks} />
              ) : (
                <Locked title="Botones adicionales" tagId={tag.id}>
                  Agrega hasta {MAX_LINKS} botones: WhatsApp, Instagram, menú, ubicación, reseñas y más.
                </Locked>
              ))}

            {isMicro && tab === "menu" &&
              (paid ? (
                <MenuEditor menu={menu} onChange={setMenu} />
              ) : (
                <Locked title="Menú, servicios o catálogo" tagId={tag.id}>
                  Muestra tu menú, tus servicios con precio o tu catálogo, con categorías, al tocar un botón.
                </Locked>
              ))}
          </div>

          {/* Columna derecha: vista previa (en celular se abre con el botón de arriba) */}
          <div className={`lg:sticky lg:top-16 lg:self-start ${view === "edit" ? "hidden lg:block" : ""}`}>
            <p className="mb-3 text-center text-xs font-medium text-slate-500">Vista previa</p>
            {isMicro ? (
              <div className="mx-auto w-full max-w-[300px] rounded-[2.5rem] border-4 border-slate-700 bg-slate-800 p-2 shadow-xl">
                <div className="h-[560px] overflow-y-auto rounded-[2rem]">
                  <Microsite
                    preview
                    name={name}
                    tagline={tagline}
                    mainUrl={url}
                    links={paid ? links : EMPTY_LINKS}
                    menu={paid ? menu : undefined}
                    theme={paid ? theme : undefined}
                    logo={paid ? logo : undefined}
                    cover={paid ? cover : undefined}
                    hideBrand={!tagShowBrand(tag)}
                  />
                </div>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-[300px] rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center text-sm text-slate-500">
                En modo redirección no hay página que mostrar. El cliente irá directo a tu enlace.
              </div>
            )}
          </div>
        </div>

        {/* Barra de guardar siempre a la mano */}
        <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-end gap-3 rounded-b-2xl border-t border-slate-800 bg-slate-900 px-4 py-3 sm:px-6">
          {error && (
            <p role="alert" className="min-w-0 flex-1 basis-full text-sm text-red-300 sm:basis-0">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
