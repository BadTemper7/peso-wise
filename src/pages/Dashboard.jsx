import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowDownLeft, FiArrowUpRight, FiCalendar, FiChevronDown, FiChevronLeft, FiChevronRight, FiEye, FiEyeOff, FiGrid, FiPlus, FiTrendingDown, FiTrendingUp, FiUsers } from "react-icons/fi";
import { Link, useSearchParams } from "react-router";
import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";
import MonthPickerOverlay from "../components/layout/MonthPickerOverlay";
import MoreActionsModal from "../components/layout/dashboard/MoreActionsModal";
import SpendingChart from "../components/layout/dashboard/SpendingChart";
import TransactionList from "../components/layout/dashboard/TransactionList";
import WalletCard from "../components/layout/dashboard/WalletCard";
import TransactionFormModal from "../components/transactions/TransactionFormModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useWorkspaceRealtime } from "../hooks/useWorkspaceRealtime";
import { formatCurrency } from "../lib/format";
import { activityService } from "../services/activityService";
import { budgetService } from "../services/budgetService";
import { categoryService } from "../services/categoryService";
import { transactionService } from "../services/transactionService";
import { walletService } from "../services/walletService";
import { getMonthBounds, getMonthValue, isFutureMonth, monthLabel, relativeTime } from "../utils/date";
import { presentWallet, transactionDisplay } from "../utils/presentation";

const realtimeTables = ["wallets", "transactions", "budgets", "activity_logs"];

export default function Dashboard() {
  const { user } = useAuth();
  const { activeWorkspace, role } = useWorkspace();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const requested = params.get("month");
  const selectedMonth = requested && /^\d{4}-\d{2}$/.test(requested) && !isFutureMonth(requested) ? requested : getMonthValue();
  const [state, setState] = useState({ wallets: [], transactions: [], categories: [], budgets: [], activity: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeWalletId, setActiveWalletId] = useState(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [presetType, setPresetType] = useState("expense");
  const [moreOpen, setMoreOpen] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!activeWorkspace?.id) return;
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const { start, end } = getMonthBounds(selectedMonth);
      const [wallets, transactions, categories, budgets, activity] = await Promise.all([
        walletService.list(activeWorkspace.id),
        transactionService.list(activeWorkspace.id, { startDate: start, endDate: end }),
        categoryService.list(activeWorkspace.id),
        budgetService.list(activeWorkspace.id, start),
        activityService.list(activeWorkspace.id, 8),
      ]);
      setState({ wallets, transactions, categories, budgets, activity });
      setActiveWalletId((current) => wallets.some((wallet) => wallet.id === current) ? current : wallets[0]?.id || null);
    } catch (error) { toast.error(error.message || "Could not load the dashboard."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [activeWorkspace?.id, selectedMonth, toast]);

  useEffect(() => { load(); }, [load]);
  const realtimeRefresh = useCallback(() => load({ silent: true }), [load]);
  useWorkspaceRealtime(activeWorkspace?.id, realtimeTables, realtimeRefresh);

  const wallets = useMemo(() => state.wallets.map(presentWallet), [state.wallets]);
  const activeWallet = wallets.find((wallet) => wallet.id === activeWalletId) || wallets[0];
  const activeIndex = Math.max(0, wallets.findIndex((wallet) => wallet.id === activeWallet?.id));
  const walletTransactions = useMemo(() => state.transactions.filter((transaction) => transaction.wallet_id === activeWallet?.id || transaction.from_wallet_id === activeWallet?.id || transaction.to_wallet_id === activeWallet?.id).map((transaction) => transactionDisplay(transaction, activeWallet?.id)), [state.transactions, activeWallet?.id]);

  const totals = useMemo(() => {
    const income = state.transactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const expenses = state.transactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    return { income, expenses, cashFlow: income - expenses };
  }, [state.transactions]);

  const budgetRows = useMemo(() => state.budgets.map((budget) => {
    const spent = state.transactions.filter((transaction) => transaction.type === "expense" && transaction.category_id === budget.category_id).reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    return { ...budget, spent, percent: Math.min(100, (spent / Number(budget.limit_amount)) * 100) };
  }), [state.budgets, state.transactions]);

  const canWrite = role !== "viewer";
  const setMonth = (value) => { const next = new URLSearchParams(params); next.set("month", value); setParams(next, { replace: true }); };
  const adjacentWallet = (direction) => { if (wallets.length < 2) return; const index = (activeIndex + direction + wallets.length) % wallets.length; setActiveWalletId(wallets[index].id); };
  const openTransaction = (type) => { setPresetType(type); setTransactionOpen(true); };

  if (loading) return <LoadingScreen compact />;

  if (wallets.length === 0) return <div><div className="mb-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">{activeWorkspace.name}</p><h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">Your dashboard</h1></div><EmptyState title="Create your first wallet" description="Add Cash, E-wallet, Debit, or Credit to start tracking money in this workspace." actionLabel={canWrite ? "Create wallet" : undefined} onAction={() => window.location.assign("/wallets?create=1")} /></div>;

  return <div className="mx-auto w-full max-w-[1500px]">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400"><FiUsers className="h-3.5 w-3.5" /> Active workspace</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{activeWorkspace.name}</h1><p className="mt-1 text-sm text-slate-400">Shared data for {monthLabel(selectedMonth)} {refreshing && "· Updating…"}</p></div><div className="grid grid-cols-3 gap-2 sm:flex">{[{ label: "Income", value: totals.income, icon: FiTrendingUp, tone: "text-emerald-600 dark:text-emerald-400" },{ label: "Expenses", value: totals.expenses, icon: FiTrendingDown, tone: "text-rose-600 dark:text-rose-400" },{ label: "Net flow", value: totals.cashFlow, icon: FiArrowUpRight, tone: totals.cashFlow >= 0 ? "text-teal-600 dark:text-teal-400" : "text-rose-600 dark:text-rose-400" }].map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2b] sm:min-w-36"><p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400"><Icon className="h-3 w-3" /> {label}</p><p className={`mt-1 truncate text-sm font-bold tabular-nums ${tone}`}>{formatCurrency(value, activeWorkspace.currency, { decimals: 0 })}</p></div>)}</div></div>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(390px,0.95fr)] xl:grid-rows-[auto_minmax(360px,1fr)]">
      <section className="min-w-0 xl:col-start-1 xl:row-start-1"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Selected wallet balance</p><button type="button" onClick={() => setHideBalance((value) => !value)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]">{hideBalance ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}</button></div><h2 className="mt-0.5 text-[28px] font-semibold leading-none tracking-[-0.03em] text-slate-950 dark:text-white sm:text-[34px]">{hideBalance ? "₱••••••" : formatCurrency(activeWallet.balance, activeWorkspace.currency)}</h2><p className="mt-1.5 text-[10px] text-slate-400">{activeWallet.name} · {activeWallet.label}</p></div><div className="flex flex-col items-end gap-2"><button type="button" onClick={() => setMonthOpen(true)} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 dark:border-slate-700 dark:bg-[#0d1a2b] dark:text-slate-200"><FiCalendar className="h-3.5 w-3.5 text-slate-400" /><span>{monthLabel(selectedMonth, true)}</span><FiChevronDown className="h-3.5 w-3.5 text-slate-400" /></button><Link to="/wallets" className="text-xs font-semibold text-teal-600 dark:text-teal-400">Manage wallets</Link></div></div>

        <div className="mt-4 sm:hidden"><div className="grid grid-cols-[42px_minmax(0,1fr)_42px] items-center gap-2.5"><button type="button" onClick={() => adjacentWallet(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.06]"><FiChevronLeft /></button><div className="flex min-w-0 justify-center"><WalletCard wallet={activeWallet} active hideBalance={hideBalance} mobileSingle onClick={() => {}} /></div><button type="button" onClick={() => adjacentWallet(1)} className="flex h-10 w-10 items-center justify-center justify-self-end rounded-full border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.06]"><FiChevronRight /></button></div><div className="mt-3 flex justify-center gap-1.5">{wallets.map((wallet, index) => <button key={wallet.id} type="button" onClick={() => setActiveWalletId(wallet.id)} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-5 bg-teal-500" : "w-1.5 bg-slate-300 dark:bg-slate-700"}`} />)}</div></div>

        <div className="scrollbar-thin -mx-1 mt-4 hidden snap-x gap-3 overflow-x-auto px-1 pb-3 pt-1 sm:flex">{wallets.map((wallet) => <WalletCard key={wallet.id} wallet={wallet} active={wallet.id === activeWallet.id} hideBalance={hideBalance} onClick={() => setActiveWalletId(wallet.id)} fluid />)}<Link to="/wallets?create=1" className="flex h-[120px] min-w-[58px] shrink-0 items-center justify-center rounded-[16px] border border-slate-200 bg-slate-100 text-slate-500 hover:border-teal-300 dark:border-white/[0.05] dark:bg-white/[0.055]"><FiPlus className="h-5 w-5" /></Link></div>

        <div className="mt-4 grid grid-cols-4 gap-3 sm:max-w-lg">{[{ label: "Send", icon: FiArrowUpRight, type: "transfer" },{ label: "Receive", icon: FiArrowDownLeft, type: "income" },{ label: "Top Up", icon: FiPlus, type: "income" },{ label: "More", icon: FiGrid, type: "more" }].map(({ label, icon: Icon, type }) => <button key={label} type="button" disabled={!canWrite && type !== "more"} onClick={() => type === "more" ? setMoreOpen(true) : openTransaction(type)} className="group flex flex-col items-center gap-2 disabled:opacity-45"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-teal-100 group-hover:text-teal-700 dark:bg-white/[0.06] dark:text-slate-200 dark:group-hover:bg-teal-400/10 dark:group-hover:text-teal-300"><Icon className="h-4 w-4" /></span><span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{label}</span></button>)}</div></section>

      <div className="xl:col-start-2 xl:row-span-2 xl:row-start-1"><TransactionList transactions={walletTransactions} walletName={activeWallet.name} compact fillHeight monthLabel={monthLabel(selectedMonth)} /></div>
      <div className="min-w-0 xl:col-start-1 xl:row-start-2"><SpendingChart transactions={walletTransactions} selectedMonth={selectedMonth} monthLabel={monthLabel(selectedMonth)} walletName={activeWallet.name} /></div>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2b] sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-950 dark:text-white">Budget usage</h2><p className="mt-1 text-xs text-slate-400">Limits for {monthLabel(selectedMonth)}</p></div><Link to="/budgets" className="text-xs font-semibold text-teal-600 dark:text-teal-400">Manage</Link></div>{budgetRows.length === 0 ? <div className="py-10 text-center text-sm text-slate-400">No budgets created for this month.</div> : <div className="mt-5 space-y-4">{budgetRows.slice(0, 5).map((budget) => <div key={budget.id}><div className="mb-2 flex items-center justify-between gap-3"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{budget.category?.name}</p><p className="text-[10px] text-slate-400">{formatCurrency(budget.spent, activeWorkspace.currency, { decimals: 0 })} / {formatCurrency(budget.limit_amount, activeWorkspace.currency, { decimals: 0 })}</p></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${budget.percent >= 100 ? "bg-rose-500" : budget.percent >= 90 ? "bg-orange-500" : budget.percent >= 75 ? "bg-amber-400" : "bg-teal-500"}`} style={{ width: `${budget.percent}%` }} /></div></div>)}</div>}</section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2b] sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-950 dark:text-white">Recent activity</h2><p className="mt-1 text-xs text-slate-400">Changes made by workspace members</p></div><Link to="/members" className="text-xs font-semibold text-teal-600 dark:text-teal-400">Members</Link></div>{state.activity.length === 0 ? <div className="py-10 text-center text-sm text-slate-400">No shared activity yet.</div> : <div className="mt-4 space-y-3">{state.activity.slice(0, 6).map((item) => <div key={item.id} className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">{(item.user?.full_name || "U").slice(0, 1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="text-xs leading-5 text-slate-700 dark:text-slate-200"><strong>{item.user?.full_name || "A member"}</strong> {item.action} {item.entity_type.replaceAll("_", " ")}</p><p className="text-[10px] text-slate-400">{relativeTime(item.created_at)}</p></div></div>)}</div>}</section></div>

    <MonthPickerOverlay open={monthOpen} selectedMonth={selectedMonth} onSelect={setMonth} onClose={() => setMonthOpen(false)} />
    <TransactionFormModal open={transactionOpen} onClose={() => setTransactionOpen(false)} workspaceId={activeWorkspace.id} userId={user.id} wallets={state.wallets} categories={state.categories} presetType={presetType} onSaved={() => load({ silent: true })} />
    {moreOpen && <MoreActionsModal walletName={activeWallet.name} onClose={() => setMoreOpen(false)} onTransfer={() => openTransaction("transfer")} onReceive={() => openTransaction("income")} onTopUp={() => openTransaction("income")} />}
  </div>;
}
