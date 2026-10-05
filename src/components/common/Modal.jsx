import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";

export default function Modal({ open, onClose, title, description, children, maxWidth = "max-w-lg", footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === "Escape") onClose?.(); };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <div className={`max-h-[92vh] w-full ${maxWidth} overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0d1a2b] sm:rounded-3xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
          <div><h2 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>}</div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/[0.06] dark:hover:text-white"><FiX className="h-5 w-5" /></button>
        </div>
        <div className="scrollbar-thin max-h-[calc(92vh-145px)] overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer && <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-white/[0.06] dark:bg-white/[0.02] sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}
