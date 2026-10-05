import React, { useState } from "react";
import { FiArrowRight, FiUsers } from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router";
import Logo from "../assets/logo.webp";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "../components/common/FormControls";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { workspaceService } from "../services/workspaceService";
import { getFriendlyError } from "../utils/errors";

export default function Onboarding() {
  const { workspaces, refreshWorkspaces, switchWorkspace } = useWorkspace();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", description: "", currency: "PHP" });
  const [loading, setLoading] = useState(false);
  const creatingAnother = params.get("new") === "1" || workspaces.length > 0;

  const submit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return toast.error("Enter a workspace name.");
    setLoading(true);
    try {
      const created = await workspaceService.create(form);
      await refreshWorkspaces({ keepSelection: false });
      switchWorkspace(created.id);
      toast.success("Workspace created. Add your first wallet to begin.");
      navigate("/wallets?create=1", { replace: true });
    } catch (error) { toast.error(getFriendlyError(error)); }
    finally { setLoading(false); }
  };

  return <div className="min-h-screen bg-[#f5f7fb] p-4 dark:bg-[#07111f] sm:p-8"><div className="mx-auto max-w-5xl"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><img src={Logo} className="h-11 w-11 rounded-xl" alt="PesoWise" /><div><p className="font-bold text-slate-950 dark:text-white">PesoWise</p><p className="text-[10px] uppercase tracking-widest text-teal-500">Money Manager</p></div></div>{creatingAnother && <SecondaryButton onClick={() => navigate("/dashboard")}>Cancel</SecondaryButton>}</div><div className="mt-10 grid overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-[#0d1a2b] lg:grid-cols-[1fr_1.05fr]"><div className="relative overflow-hidden bg-gradient-to-br from-[#082f62] via-[#0c5784] to-[#0e8c82] p-8 text-white sm:p-12"><div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" /><div className="relative"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><FiUsers className="h-5 w-5" /></span><h1 className="mt-7 text-3xl font-bold tracking-tight sm:text-4xl">{creatingAnother ? "Create another workspace" : "Create your first budget"}</h1><p className="mt-4 max-w-md text-sm leading-7 text-white/70">A workspace keeps wallets, transactions, budgets, reports, and members together. It starts private and only becomes shared when you invite someone.</p><div className="mt-8 space-y-3 text-sm text-white/80"><p>✓ Separate personal, family, travel, or business budgets</p><p>✓ Invite people using their own secure accounts</p><p>✓ Switch workspaces without mixing financial data</p></div></div></div><form onSubmit={submit} className="space-y-5 p-7 sm:p-10"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Workspace setup</p><h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Name your budget</h2></div><Field label="Workspace name" required><input autoFocus value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} className={inputClass} placeholder="Our Household Budget" maxLength={80} /></Field><Field label="Description" hint="Optional"><textarea value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} className={textareaClass} placeholder="Shared household income, bills, and daily expenses" /></Field><Field label="Currency"><select value={form.currency} onChange={(e) => setForm((v) => ({ ...v, currency: e.target.value }))} className={inputClass}><option value="PHP">PHP — Philippine Peso</option><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option></select></Field><PrimaryButton loading={loading} type="submit" className="w-full">Create workspace <FiArrowRight className="h-4 w-4" /></PrimaryButton></form></div></div></div>;
}
