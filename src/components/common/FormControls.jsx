import React from "react";

export const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-white/[0.04] dark:text-white dark:focus:border-teal-400 dark:disabled:bg-white/[0.02]";
export const selectClass = `${inputClass} appearance-none`;
export const textareaClass = "min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-white/[0.04] dark:text-white";

export function Field({ label, htmlFor, hint, error, required, children }) {
  return <div><div className="mb-1.5 flex items-center justify-between gap-3"><label htmlFor={htmlFor} className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}{required && <span className="ml-1 text-rose-500">*</span>}</label>{hint && <span className="text-[10px] text-slate-400">{hint}</span>}</div>{children}{error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}</div>;
}

export function PrimaryButton({ children, loading, disabled, className = "", ...props }) {
  return <button {...props} disabled={disabled || loading} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-55 ${className}`}>{loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/25 border-t-slate-950" />}{children}</button>;
}

export function SecondaryButton({ children, className = "", ...props }) {
  return <button {...props} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.07] ${className}`}>{children}</button>;
}
