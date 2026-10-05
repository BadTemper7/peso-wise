import React from "react";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import { Link } from "react-router";

const SectionPlaceholder = ({ eyebrow = "PesoWise", title, description, actionLabel = "Add new" }) => (
  <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button type="button" className="flex h-10 w-fit items-center gap-2 rounded-xl bg-[#0b4d86] px-4 text-xs font-bold text-white dark:bg-teal-500 dark:text-[#041b22]">
        <FiPlus className="h-4 w-4" /> {actionLabel}
      </button>
    </div>

    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-[0_8px_30px_rgba(15,23,42,0.03)] dark:border-slate-700 dark:bg-[#0d1a2b]">
      <div className="mx-auto max-w-lg">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">This section is ready for its full feature module.</p>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">The navigation and page shell are already wired so this route no longer sends users back to login while the remaining functionality is being built.</p>
        <Link to="/dashboard" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400">
          <FiArrowLeft className="h-4 w-4" /> Back to overview
        </Link>
      </div>
    </div>
  </div>
);

export default SectionPlaceholder;
