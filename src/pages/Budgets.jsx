import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiCalendar, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import BudgetFormModal from "../components/budgets/BudgetFormModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";
import MonthPickerOverlay from "../components/layout/MonthPickerOverlay";
import PageHeader from "../components/common/PageHeader";
import { PrimaryButton } from "../components/common/FormControls";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useWorkspaceRealtime } from "../hooks/useWorkspaceRealtime";
import { formatCurrency } from "../lib/format";
import { budgetService } from "../services/budgetService";
import { categoryService } from "../services/categoryService";
import { transactionService } from "../services/transactionService";
import { getMonthBounds, getMonthValue, monthLabel } from "../utils/date";
import { getFriendlyError } from "../utils/errors";

const realtimeTables = ["budgets", "transactions"];

export default function Budgets() {
  const { user } = useAuth(); const { activeWorkspace, role } = useWorkspace(); const toast = useToast();
  const [month, setMonth] = useState(getMonthValue()); const [monthOpen, setMonthOpen] = useState(false); const [budgets, setBudgets] = useState([]); const [categories, setCategories] = useState([]); const [transactions, setTransactions] = useState([]); const [loading, setLoading] = useState(true); const [formOpen, setFormOpen] = useState(false); const [editing, setEditing] = useState(null); const [deleting, setDeleting] = useState(null); const [deleteLoading, setDeleteLoading] = useState(false);
  const canManage = ["owner","admin"].includes(role);
  const load = useCallback(async ({ silent = false } = {}) => { if (!silent) setLoading(true); try { const { start, end } = getMonthBounds(month); const [nextBudgets, nextCategories, nextTransactions] = await Promise.all([budgetService.list(activeWorkspace.id, start), categoryService.list(activeWorkspace.id, "expense"), transactionService.list(activeWorkspace.id, { startDate: start, endDate: end, type: "expense" })]); setBudgets(nextBudgets); setCategories(nextCategories); setTransactions(nextTransactions); } catch (error) { toast.error(getFriendlyError(error)); } finally { setLoading(false); } }, [activeWorkspace.id, month, toast]);
  useEffect(() => { load(); }, [load]); useWorkspaceRealtime(activeWorkspace.id, realtimeTables, useCallback(() => load({ silent: true }), [load]));
  const rows = useMemo(() => budgets.map((budget) => { const spent = transactions.filter((transaction) => transaction.category_id === budget.category_id).reduce((sum, transaction) => sum + Number(transaction.amount), 0); const percent = (spent / Number(budget.limit_amount)) * 100; return { ...budget, spent, percent }; }), [budgets, transactions]);
  const deleteBudget = async () => { if (!deleting) return; setDeleteLoading(true); try { await budgetService.remove(deleting.id); toast.success("Budget deleted."); setDeleting(null); load({ silent: true }); } catch (error) { toast.error(getFriendlyError(error)); } finally { setDeleteLoading(false); } };
  if (loading) return <LoadingScreen compact />;
  return <div><PageHeader eyebrow={activeWorkspace.name} title="Monthly budgets" description="Set category limits and get clear warnings as the workspace approaches or exceeds them." actions={<><button type="button" onClick={() => setMonthOpen(true)} className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-white/[0.04] dark:text-slate-200"><FiCalendar /> {monthLabel(month)}</button>{canManage && <PrimaryButton onClick={() => { setEditing(null); setFormOpen(true); }}><FiPlus /> Create budget</PrimaryButton>}</>} />
    {rows.length === 0 ? <EmptyState title="No budgets for this month" description="Create spending limits for Food, Transportation, Bills, and other expense categories." actionLabel={canManage ? "Create budget" : undefined} onAction={() => setFormOpen(true)} /> : <div className="grid gap-4 lg:grid-cols-2">{rows.map((budget) => { const state = budget.percent >= 100 ? "Over budget" : budget.percent >= 90 ? "90% used" : budget.percent >= 75 ? "75% used" : "On track"; const tone = budget.percent >= 100 ? "bg-rose-500" : budget.percent >= 90 ? "bg-orange-500" : budget.percent >= 75 ? "bg-amber-400" : "bg-teal-500"; return <article key={budget.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2b]"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-slate-900 dark:text-white">{budget.category?.name}</p><p className="mt-1 text-xs text-slate-400">{formatCurrency(budget.spent, activeWorkspace.currency)} of {formatCurrency(budget.limit_amount, activeWorkspace.currency)}</p></div>{canManage && <div className="flex gap-1"><button onClick={() => { setEditing(budget); setFormOpen(true); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/[0.06]"><FiEdit2 /></button><button onClick={() => setDeleting(budget)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-400/10"><FiTrash2 /></button></div>}</div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${Math.min(100, budget.percent)}%` }} /></div><div className="mt-3 flex items-center justify-between"><p className={`flex items-center gap-1.5 text-xs font-semibold ${budget.percent >= 100 ? "text-rose-500" : budget.percent >= 75 ? "text-amber-600" : "text-teal-600"}`}>{budget.percent >= 75 && <FiAlertCircle />} {state}</p><p className="text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300">{Math.round(budget.percent)}%</p></div></article>; })}</div>}
    <MonthPickerOverlay open={monthOpen} selectedMonth={month} onSelect={setMonth} onClose={() => setMonthOpen(false)} />
    <BudgetFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} workspaceId={activeWorkspace.id} userId={user.id} monthStart={getMonthBounds(month).start} categories={categories} budget={editing} onSaved={() => load({ silent: true })} />
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={deleteBudget} title="Delete budget?" description="Transactions will remain, but this monthly spending limit will be removed." confirmLabel="Delete" loading={deleteLoading} danger />
  </div>;
}
