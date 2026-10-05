import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import { TransactionsSkeleton } from "../components/common/LoadingStates";
import PageHeader from "../components/common/PageHeader";
import { inputClass, PrimaryButton, SecondaryButton } from "../components/common/FormControls";
import TransactionFormModal from "../components/transactions/TransactionFormModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useWorkspaceRealtime } from "../hooks/useWorkspaceRealtime";
import { formatCurrency } from "../lib/format";
import { categoryService } from "../services/categoryService";
import { transactionService } from "../services/transactionService";
import { walletService } from "../services/walletService";
import { formatDate, getDateValue, getMonthBounds, getMonthValue } from "../utils/date";
import { getFriendlyError } from "../utils/errors";
import { walletOptionLabel } from "../utils/presentation";

const realtimeTables = ["transactions", "wallets"];

function getRange(preset, customStart, customEnd) {
  const now = new Date();
  const end = getDateValue(now);
  if (preset === "today") return { startDate: end, endDate: end };
  if (preset === "week") { const start = new Date(now); start.setDate(now.getDate() - ((now.getDay() + 6) % 7)); return { startDate: getDateValue(start), endDate: end }; }
  if (preset === "month") { const { start, end: monthEnd } = getMonthBounds(getMonthValue()); return { startDate: start, endDate: monthEnd }; }
  return { startDate: customStart || undefined, endDate: customEnd || undefined };
}

export default function Transactions() {
  const { user } = useAuth(); const { activeWorkspace, role } = useWorkspace(); const toast = useToast();
  const [transactions, setTransactions] = useState([]); const [wallets, setWallets] = useState([]); const [categories, setCategories] = useState([]); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); const [type, setType] = useState("all"); const [walletId, setWalletId] = useState(""); const [range, setRange] = useState("month"); const [customStart, setCustomStart] = useState(""); const [customEnd, setCustomEnd] = useState("");
  const [formOpen, setFormOpen] = useState(false); const [editing, setEditing] = useState(null); const [deleting, setDeleting] = useState(null); const [savingDelete, setSavingDelete] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!activeWorkspace?.id) return;
    if (!silent) setLoading(true);
    try { const filters = { ...getRange(range, customStart, customEnd), type, walletId: walletId || undefined }; const [tx, nextWallets, nextCategories] = await Promise.all([transactionService.list(activeWorkspace.id, filters), walletService.list(activeWorkspace.id), categoryService.list(activeWorkspace.id)]); setTransactions(tx); setWallets(nextWallets); setCategories(nextCategories); }
    catch (error) { toast.error(getFriendlyError(error)); }
    finally { setLoading(false); }
  }, [activeWorkspace?.id, range, customStart, customEnd, type, walletId, toast]);
  useEffect(() => { load(); }, [load]);
  const realtimeRefresh = useCallback(() => load({ silent: true }), [load]);
  useWorkspaceRealtime(activeWorkspace?.id, realtimeTables, realtimeRefresh);

  const visible = useMemo(() => { const term = search.trim().toLowerCase(); if (!term) return transactions; return transactions.filter((transaction) => [transaction.description, transaction.category?.name, transaction.wallet?.name, transaction.from_wallet?.name, transaction.to_wallet?.name, transaction.creator?.full_name].some((value) => String(value || "").toLowerCase().includes(term))); }, [transactions, search]);
  const canCreate = role !== "viewer";
  const canEdit = (transaction) => !transaction.is_system_generated && transaction.transfer_kind === "standard" && (["owner","admin"].includes(role) || (role === "member" && transaction.created_by === user.id));
  const remove = async () => { if (!deleting) return; setSavingDelete(true); try { await transactionService.remove(deleting.id); toast.success("Transaction deleted."); setDeleting(null); load({ silent: true }); } catch (error) { toast.error(getFriendlyError(error)); } finally { setSavingDelete(false); } };

  if (loading) return <TransactionsSkeleton />;
  return <div><PageHeader eyebrow={activeWorkspace.name} title="Transactions" description="Search and manage income, expenses, and transfers recorded by workspace members." actions={canCreate && <PrimaryButton onClick={() => { setEditing(null); setFormOpen(true); }}><FiPlus /> Add transaction</PrimaryButton>} />
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2b]"><div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(130px,auto))]"><div className="relative"><FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} pl-10`} placeholder="Search description, wallet, member…" /></div><select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option><option value="transfer">Transfer</option></select><select value={walletId} onChange={(e) => setWalletId(e.target.value)} className={inputClass}><option value="">All wallets</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{walletOptionLabel(wallet, user.id)}</option>)}</select><select value={range} onChange={(e) => setRange(e.target.value)} className={inputClass}><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option><option value="custom">Custom range</option></select></div>{range === "custom" && <div className="mt-3 flex flex-wrap items-center gap-2"><input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={`${inputClass} max-w-48`} /><span className="text-xs text-slate-400">to</span><input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={`${inputClass} max-w-48`} /></div>}</section>
    {visible.length === 0 ? <EmptyState title="No transactions found" description="Add your first income or expense, or adjust the current filters." actionLabel={canCreate ? "Add transaction" : undefined} onAction={() => setFormOpen(true)} /> : <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0d1a2b]"><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[920px] text-left"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 dark:bg-white/[0.025]"><tr><th className="px-5 py-3">Transaction</th><th className="px-4 py-3">Wallet</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Added by</th><th className="px-4 py-3 text-right">Amount</th><th className="w-24 px-4 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{visible.map((transaction) => { const positive = transaction.type === "income"; const walletName = transaction.type === "transfer" ? `${transaction.from_wallet?.name} → ${transaction.to_wallet?.name}` : transaction.wallet?.name; const transferLabel = transaction.transfer_kind === "month_end_savings" ? "Month-end Savings" : transaction.transfer_kind === "savings_borrow" ? "Borrowed from Savings" : transaction.transfer_kind === "savings_repayment" ? "Savings repayment" : "Wallet transfer"; return <tr key={transaction.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.025]"><td className="px-5 py-4"><p className="text-sm font-semibold text-slate-900 dark:text-white">{transaction.description || transaction.category?.name || "Transfer"}</p><p className="mt-0.5 text-[10px] capitalize text-slate-400">{transaction.type} · {transaction.category?.name || transferLabel}</p></td><td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300">{walletName}</td><td className="px-4 py-4 text-xs text-slate-500">{formatDate(transaction.transaction_date)}</td><td className="px-4 py-4 text-xs text-slate-500">{transaction.is_system_generated ? "PesoWise automation" : transaction.created_by === user.id ? "You" : transaction.creator?.full_name || "Member"}</td><td className={`px-4 py-4 text-right text-sm font-bold tabular-nums ${transaction.type === "expense" ? "text-rose-600 dark:text-rose-400" : transaction.type === "transfer" ? "text-cyan-600 dark:text-cyan-400" : "text-emerald-600 dark:text-emerald-400"}`}>{transaction.type === "expense" ? "−" : positive ? "+" : ""}{formatCurrency(transaction.amount, activeWorkspace.currency)}</td><td className="px-4 py-4"><div className="flex justify-end gap-1">{canEdit(transaction) && transaction.type !== "transfer" && <button onClick={() => { setEditing(transaction); setFormOpen(true); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/[0.06]"><FiEdit2 /></button>}{canEdit(transaction) && <button onClick={() => setDeleting(transaction)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-400/10"><FiTrash2 /></button>}</div></td></tr>; })}</tbody></table></div><div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">{visible.map((transaction) => <div key={transaction.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{transaction.description || transaction.category?.name || "Transfer"}</p><p className="mt-1 text-[10px] text-slate-400">{formatDate(transaction.transaction_date)} · {transaction.is_system_generated ? "Created by PesoWise automation" : transaction.created_by === user.id ? "Created by You" : `Added by ${transaction.creator?.full_name || "Member"}`}</p></div><p className={`shrink-0 text-sm font-bold ${transaction.type === "expense" ? "text-rose-500" : transaction.type === "income" ? "text-emerald-500" : "text-cyan-500"}`}>{transaction.type === "expense" ? "−" : transaction.type === "income" ? "+" : ""}{formatCurrency(transaction.amount, activeWorkspace.currency)}</p></div>{canEdit(transaction) && <div className="mt-3 flex gap-2">{transaction.type !== "transfer" && <SecondaryButton onClick={() => { setEditing(transaction); setFormOpen(true); }} className="h-9 flex-1"><FiEdit2 /> Edit</SecondaryButton>}<SecondaryButton onClick={() => setDeleting(transaction)} className="h-9 flex-1 text-rose-500"><FiTrash2 /> Delete</SecondaryButton></div>}</div>)}</div></section>}
    <TransactionFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} workspaceId={activeWorkspace.id} userId={user.id} wallets={wallets} categories={categories} initialTransaction={editing} onSaved={() => load({ silent: true })} />
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} title="Delete transaction?" description="Wallet balances and reports will be recalculated automatically." confirmLabel="Delete" loading={savingDelete} danger />
  </div>;
}
