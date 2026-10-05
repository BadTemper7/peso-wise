import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiPlus, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useWorkspace } from "../../contexts/WorkspaceContext";

export default function WorkspaceSwitcher({ compact = false, onNavigate }) {
  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!activeWorkspace) return null;
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className={`flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 text-left transition hover:border-teal-300 hover:bg-teal-50/60 dark:border-white/[0.07] dark:bg-white/[0.035] dark:hover:border-teal-400/25 dark:hover:bg-teal-400/[0.06] ${compact ? "h-10 px-3" : "p-3"}`} aria-expanded={open}>
        <span className={`flex shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300 ${compact ? "h-7 w-7" : "h-9 w-9"}`}><FiUsers className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className={`block truncate font-bold text-slate-900 dark:text-white ${compact ? "text-xs" : "text-sm"}`}>{activeWorkspace.name}</span>{!compact && <span className="mt-0.5 block text-[10px] capitalize text-slate-400">{activeWorkspace.role} · {activeWorkspace.currency}</span>}</span>
        <FiChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute z-[70] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-[#0d1a2b] ${compact ? "right-0 w-72" : "left-0 right-0"}`}>
          <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspaces</p>
          <div className="scrollbar-thin max-h-64 space-y-1 overflow-y-auto">
            {workspaces.map((workspace) => (
              <button key={workspace.id} type="button" onClick={() => { switchWorkspace(workspace.id); setOpen(false); onNavigate?.(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-white/[0.05]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-teal-400 text-xs font-bold text-white">{workspace.name.slice(0, 2).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{workspace.name}</span><span className="block text-[10px] capitalize text-slate-400">{workspace.role}</span></span>
                {workspace.id === activeWorkspace.id && <FiCheck className="h-4 w-4 text-teal-500" />}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setOpen(false); navigate("/onboarding?new=1"); onNavigate?.(); }} className="mt-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-xs font-bold text-teal-600 transition hover:border-teal-300 hover:bg-teal-50 dark:border-slate-700 dark:text-teal-400 dark:hover:bg-teal-400/10"><FiPlus className="h-4 w-4" /> Create workspace</button>
        </div>
      )}
    </div>
  );
}
