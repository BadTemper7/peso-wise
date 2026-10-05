import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FiArchive, FiCalendar, FiDownload, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { ReportsSkeleton } from "../components/common/LoadingStates";
import MonthPickerOverlay from "../components/layout/MonthPickerOverlay";
import PageHeader from "../components/common/PageHeader";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useWorkspaceRealtime } from "../hooks/useWorkspaceRealtime";
import { formatCurrency } from "../lib/format";
import { budgetService } from "../services/budgetService";
import { transactionService } from "../services/transactionService";
import { walletService } from "../services/walletService";
import { getDateValue, getMonthBounds, getMonthValue, monthLabel } from "../utils/date";
import { getFriendlyError } from "../utils/errors";

const palette = ["#14b8a6", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#22c55e", "#ec4899", "#64748b"];
const axisTick = { fill: "var(--muted)", fontSize: 10 };
const realtimeTables = ["transactions", "budgets", "wallets", "wallet_month_closures"];

export default function Reports() {
  const { activeWorkspace } = useWorkspace();
  const toast = useToast();
  const [month, setMonth] = useState(getMonthValue());
  const [monthOpen, setMonthOpen] = useState(false);
  const [range, setRange] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [walletSnapshots, setWalletSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const now = new Date();
      const today = getDateValue(now);
      let start;
      let end;
      if (range === "today") { start = today; end = today; }
      else if (range === "week") { const weekStart = new Date(now); weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); start = getDateValue(weekStart); end = today; }
      else if (range === "custom") { start = customStart || undefined; end = customEnd || undefined; }
      else ({ start, end } = getMonthBounds(month));

      const budgetMonth = getMonthBounds(start ? start.slice(0, 7) : month).start;
      const [tx, nextBudgets, snapshots] = await Promise.all([
        transactionService.list(activeWorkspace.id, { startDate: start, endDate: end }),
        budgetService.list(activeWorkspace.id, budgetMonth),
        range === "month" ? walletService.listForMonth(activeWorkspace.id, month, { includeArchived: true }) : Promise.resolve([]),
      ]);
      setTransactions(tx);
      setBudgets(nextBudgets);
      setWalletSnapshots(snapshots);
    } catch (error) { toast.error(getFriendlyError(error)); }
    finally { setLoading(false); setRefreshing(false); }
  }, [activeWorkspace.id, month, range, customStart, customEnd, toast]);

  useEffect(() => { load(); }, [load]);
  useWorkspaceRealtime(activeWorkspace.id, realtimeTables, useCallback(() => load({ silent: true }), [load]));

  const report = useMemo(() => {
    const income = transactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const expense = transactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const categoryMap = new Map();
    const walletMap = new Map();
    const dayMap = new Map();
    const memberMap = new Map();
    transactions.forEach((transaction) => {
      const day = Number(transaction.transaction_date.slice(-2));
      if (!dayMap.has(day)) dayMap.set(day, { day: String(day), income: 0, expense: 0 });
      if (transaction.type === "income") dayMap.get(day).income += Number(transaction.amount);
      if (transaction.type === "expense") {
        dayMap.get(day).expense += Number(transaction.amount);
        const category = transaction.category?.name || "Other";
        categoryMap.set(category, (categoryMap.get(category) || 0) + Number(transaction.amount));
        const wallet = transaction.wallet?.name || "Wallet";
        walletMap.set(wallet, (walletMap.get(wallet) || 0) + Number(transaction.amount));
      }
      const member = transaction.is_system_generated ? "PesoWise automation" : transaction.creator?.full_name || "Member";
      memberMap.set(member, (memberMap.get(member) || 0) + 1);
    });
    const budgetData = budgets.map((budget) => ({ name: budget.category?.name || "Category", limit: Number(budget.limit_amount), actual: categoryMap.get(budget.category?.name) || 0 }));
    return {
      income,
      expense,
      net: income - expense,
      categoryData: [...categoryMap].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      walletData: [...walletMap].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      trendData: [...dayMap.values()].sort((a, b) => Number(a.day) - Number(b.day)),
      memberData: [...memberMap].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      budgetData,
    };
  }, [transactions, budgets]);

  const monthEnd = useMemo(() => {
    const regular = walletSnapshots.filter((wallet) => !wallet.is_savings);
    const savings = walletSnapshots.find((wallet) => wallet.is_savings);
    return {
      before: regular.reduce((sum, wallet) => sum + Number(wallet.balance_before_savings || 0), 0),
      moved: regular.reduce((sum, wallet) => sum + Number(wallet.month_end_savings || 0), 0),
      after: regular.reduce((sum, wallet) => sum + Number(wallet.closing_balance || 0), 0),
      savings: Number(savings?.closing_balance || 0),
    };
  }, [walletSnapshots]);

  const exportCsv = () => {
    const rows = [["Date", "Type", "Transfer Kind", "Description", "Category", "Wallet", "Amount", "Added By"], ...transactions.map((transaction) => [transaction.transaction_date, transaction.type, transaction.transfer_kind || "standard", transaction.description, transaction.category?.name || "", transaction.wallet?.name || `${transaction.from_wallet?.name || ""} -> ${transaction.to_wallet?.name || ""}`, transaction.amount, transaction.is_system_generated ? "PesoWise automation" : transaction.creator?.full_name || ""] )];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pesowise-${activeWorkspace.name}-${month}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <ReportsSkeleton />;
  const moneyTooltip = ({ active, payload, label }) => active && payload?.length ? <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl dark:border-slate-700 dark:bg-[#0b1727]"><p className="font-bold text-slate-900 dark:text-white">{label}</p>{payload.map((item) => <p key={item.name} className="mt-1 text-slate-500">{item.name}: {formatCurrency(item.value, activeWorkspace.currency)}</p>)}</div> : null;

  return <div>
    <PageHeader eyebrow={activeWorkspace.name} title="Financial reports" description={`Review cash flow, spending patterns, budget performance, wallets, and member-recorded activity.${refreshing ? " Updating…" : ""}`} actions={<><select value={range} onChange={(event) => setRange(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-[#0f1d30] dark:text-white"><option value="today">Today</option><option value="week">This week</option><option value="month">Selected month</option><option value="custom">Custom range</option></select>{range === "month" && <button type="button" onClick={() => setMonthOpen(true)} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-center text-sm font-semibold leading-none dark:border-slate-700 dark:bg-white/[0.04]"><FiCalendar /> {monthLabel(month)}</button>}<button type="button" onClick={exportCsv} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-center text-sm font-bold leading-none text-white transition hover:bg-teal-500 active:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"><FiDownload /> Export CSV</button></>} />
    {range === "custom" && <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0d1a2b]"><span className="text-xs font-semibold text-slate-500">Custom date range</span><input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#0f1d30]" /><span className="text-xs text-slate-400">to</span><input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#0f1d30]" /></div>}

    <div className="grid gap-4 sm:grid-cols-3">{[{ label: "Total income", value: report.income, icon: FiTrendingUp, tone: "text-emerald-500" },{ label: "Total expenses", value: report.expense, icon: FiTrendingDown, tone: "text-rose-500" },{ label: "Net cash flow", value: report.net, icon: report.net >= 0 ? FiTrendingUp : FiTrendingDown, tone: report.net >= 0 ? "text-teal-500" : "text-rose-500" }].map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2b]"><p className="flex items-center gap-2 text-xs font-semibold text-slate-400"><Icon className={tone} /> {label}</p><p className={`mt-3 text-2xl font-bold ${tone}`}>{formatCurrency(value, activeWorkspace.currency)}</p></div>)}</div>

    {range === "month" && <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/40 p-5 dark:border-violet-500/20 dark:bg-violet-400/[0.04]"><div className="flex items-center gap-2"><FiArchive className="text-violet-500" /><div><h2 className="text-sm font-bold text-slate-900 dark:text-white">Month-end Savings</h2><p className="mt-0.5 text-xs text-slate-400">Remaining positive wallet balances are transferred to Savings without counting as income or expense.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Remaining before transfer", value: monthEnd.before },{ label: "Moved to Savings", value: monthEnd.moved },{ label: "Regular wallets after", value: monthEnd.after },{ label: "Savings closing balance", value: monthEnd.savings }].map((item) => <div key={item.label} className="rounded-xl border border-violet-100 bg-white/80 p-4 dark:border-violet-500/10 dark:bg-white/[0.035]"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p><p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(item.value, activeWorkspace.currency)}</p></div>)}</div></section>}

    <div className="mt-6 grid gap-6 xl:grid-cols-2"><ChartCard title="Income vs expense" subtitle="Daily cash movement"><ResponsiveContainer width="100%" height="100%"><LineChart data={report.trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" /><XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} /><YAxis tick={axisTick} axisLine={false} tickLine={false} /><Tooltip content={moneyTooltip} /><Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive animationDuration={850} /><Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} dot={false} isAnimationActive animationDuration={850} /></LineChart></ResponsiveContainer></ChartCard><ChartCard title="Spending by category" subtitle="Where workspace money went"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={report.categoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={94} paddingAngle={3} isAnimationActive>{report.categoryData.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}</Pie><Tooltip content={moneyTooltip} /></PieChart></ResponsiveContainer><LegendList data={report.categoryData} currency={activeWorkspace.currency} /></ChartCard><ChartCard title="Spending by wallet" subtitle="Expense usage across accounts"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.walletData} layout="vertical" margin={{ top: 10, right: 20, left: 15, bottom: 0 }}><CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 5" /><XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={80} tick={axisTick} axisLine={false} tickLine={false} /><Tooltip content={moneyTooltip} /><Bar dataKey="value" fill="#14b8a6" radius={[0, 8, 8, 0]} isAnimationActive animationDuration={850} /></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Budget vs actual" subtitle="Monthly limits and expenses"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.budgetData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" /><XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} /><YAxis tick={axisTick} axisLine={false} tickLine={false} /><Tooltip content={moneyTooltip} /><Bar dataKey="limit" fill="#94a3b8" radius={[6, 6, 0, 0]} /><Bar dataKey="actual" fill="#f59e0b" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Member contributions" subtitle="Number of transactions recorded by each member"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.memberData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" /><XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} /><YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip /><Bar dataKey="value" name="Transactions recorded" fill="#3b82f6" radius={[8, 8, 0, 0]} isAnimationActive /></BarChart></ResponsiveContainer></ChartCard></div>
    <MonthPickerOverlay open={monthOpen} selectedMonth={month} onSelect={setMonth} onClose={() => setMonthOpen(false)} />
  </div>;
}

function ChartCard({ title, subtitle, children }) { return <section className="min-h-[390px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2b] sm:p-6"><h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2><p className="mt-1 text-xs text-slate-400">{subtitle}</p><div className="mt-5 h-[270px]">{children}</div></section>; }
function LegendList({ data, currency }) { return <div className="-mt-3 grid grid-cols-2 gap-2">{data.slice(0, 6).map((item, index) => <div key={item.name} className="flex items-center gap-2 text-[10px] text-slate-500"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} /><span className="truncate">{item.name}</span><span className="ml-auto font-semibold">{formatCurrency(item.value, currency, { decimals: 0 })}</span></div>)}</div>; }
