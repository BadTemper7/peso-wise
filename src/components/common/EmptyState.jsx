import React from "react";
import { FiInbox } from "react-icons/fi";

export default function EmptyState({ icon: Icon = FiInbox, title, description, actionLabel, onAction, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-center dark:border-slate-700 dark:bg-[#0d1a2b] ${compact ? "p-7" : "min-h-72 p-10"}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300"><Icon className="h-5 w-5" /></span>
      <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">{description}</p>}
      {actionLabel && <button type="button" onClick={onAction} className="mt-5 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-teal-400">{actionLabel}</button>}
    </div>
  );
}
