"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default function RevokedNotice({ uid }) {
  const [notices, setNotices] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    const load = async () => {
      try {
        const q = query(
          collection(db, "notices"),
          where("owner_uid", "==", uid),
          where("read", "==", false)
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0));
        setNotices(list);
      } catch (err) {
        console.error("No se pudieron cargar los avisos:", err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const current = notices[0];
  if (!current) return null;

  const dismiss = async () => {
    setBusy(true);
    try {
      await updateDoc(doc(db, "notices", current.id), { read: true });
    } catch (err) {
      console.error(err);
    } finally {
      setNotices((n) => n.slice(1));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        className="m-auto w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl ring-1 ring-red-500/30">
          ⚠️
        </div>

        <h2 className="text-center text-xl font-semibold text-slate-50">Acceso revocado</h2>
        {notices.length > 1 && (
          <p className="mt-1 text-center text-xs text-slate-500">1 de {notices.length} avisos</p>
        )}

        <p className="mt-3 text-center text-sm text-slate-300">
          Se revocó tu acceso al GT{" "}
          <span className="font-mono text-slate-50">{current.tag_id}</span>
          {current.business_name ? ` (${current.business_name})` : ""}.
        </p>

        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4">
          <p className="mb-1 text-xs font-medium text-slate-500">Motivo</p>
          <p className="whitespace-pre-wrap break-words text-sm text-slate-200">{current.reason}</p>
        </div>

        {(current.contact_email || current.contact_phone) && (
          <div className="mt-4 text-center text-sm text-slate-400">
            <p>Para más información, contáctanos:</p>
            {current.contact_email && (
              <p className="mt-1">
                <a href={`mailto:${current.contact_email}`} className="text-brand-400 hover:underline">
                  {current.contact_email}
                </a>
              </p>
            )}
            {current.contact_phone && (
              <p className="mt-0.5">
                <a href={`tel:${current.contact_phone}`} className="text-brand-400 hover:underline">
                  {current.contact_phone}
                </a>
              </p>
            )}
          </div>
        )}

        <button
          onClick={dismiss}
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-60"
        >
          Entendido
        </button>
        <p className="mt-4 text-center text-xs text-slate-600">GodsTap · by God’s Plan</p>
      </div>
    </div>
  );
}