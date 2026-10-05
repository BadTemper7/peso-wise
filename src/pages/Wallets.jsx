import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiArchive, FiCalendar, FiCreditCard, FiDollarSign, FiEdit2, FiPlus, FiRefreshCw, FiRotateCcw, FiSmartphone } from "react-icons/fi";
import { useSearchParams } from "react-router";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import { WalletsSkeleton } from "../components/common/LoadingStates";
import PageHeader from "../components/common/PageHeader";
import { PrimaryButton, SecondaryButton } from "../components/common/FormControls";
import MonthPickerOverlay from "../components/layout/MonthPickerOverlay";
import SavingsTransferModal from "../components/layout/dashboard/SavingsTransferModal";
import WalletFormModal from "../components/wallets/WalletFormModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useWorkspaceRealtime } from "../hooks/useWorkspaceRealtime";
import { formatCurrency } from "../lib/format";
import { savingsService } from "../services/savingsService";
import { walletService } from "../services/walletService";
import { formatDate, getMonthValue, isFutureMonth, monthLabel } from "../utils/date";
import { getFriendlyError } from "../utils/errors";
import { walletCreatorName, walletTypePresentation } from "../utils/presentation";

const typeIcons = { cash: FiDollarSign, ewallet: FiSmartphone, debit: FiCreditCard, credit: FiCreditCard };
const realtimeTables = ["wallets", "transactions", "savings_loans", "wallet_month_closures"];

export default function Wallets() {
  const { user } = useAuth();
  const { activeWorkspace, role } = useWorkspace();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const requested = params.get("month");
  const selectedMonth = requested && /^\d{4}-\d{2}$/.test(requested) && !isFutureMonth(requested) ? requested : getMonthValue();
  const [wallets, setWallets] = useState([]);
  const [currentWallets, setCurrentWallets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [archiving, setArchiving] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [savingsAction, setSavingsAction] = useState(null);
  const reconciledWorkspace = useRef(null);

  const canManage = ["owner", "admin"].includes(role) || (role === "member" && Boolean(activeWorkspace.settings?.member_can_manage_wallets));
  const canMoveSavings = role !== "viewer";

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      if (reconciledWorkspace.current !== activeWorkspace.id) {
        try { await savingsService.reconcileMonthEnd(activeWorkspace.id); } catch { /* scheduled processing remains primary */ }
        reconciledWorkspace.current = activeWorkspace.id;
      }
      const [historical, current, nextLoans] = await Promise.all([
        walletService.listForMonth(activeWorkspace.id, selectedMonth, { includeArchived: true }),
        walletService.list(activeWorkspace.id, { includeArchived: true }),
        savingsService.listLoans(activeWorkspace.id),
      ]);
      setWallets(historical);
      setCurrentWallets(current);
      setLoans(nextLoans);
    } catch (error) {
      toast.error(getFriendlyError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeWorkspace.id, selectedMonth, toast]);

  useEffect(() => { load(); }, [load]);
  useWorkspaceRealtime(activeWorkspace.id, realtimeTables, useCallback(() => load({ silent: true }), [load]));
  useEffect(() => {
    if (params.get("create") === "1" && canManage) {
      setEditing(null);
      setFormOpen(true);
      const next = new URLSearchParams(params);
      next.delete("create");
      setParams(next, { replace: true });
    }
  }, [params, canManage, setParams]);

  const active = useMemo(() => wallets.filter((wallet) => !wallet.is_archived && !wallet.is_savings), [wallets]);
  const archived = useMemo(() => wallets.filter((wallet) => wallet.is_archived && !wallet.is_savings), [wallets]);
  const currentSavingsWallet = currentWallets.find((wallet) => wallet.is_savings);
  const historicalSavingsWallet = wallets.find((wallet) => wallet.is_savings) || currentSavingsWallet;
  const regularCurrent = currentWallets.filter((wallet) => !wallet.is_savings && !wallet.is_archived);
  const outstanding = loans.filter((loan) => loan.status === "open").reduce((sum, loan) => sum + Number(loan.outstanding_amount), 0);

  const setMonth = (value) => { const next = new URLSearchParams(params); next.set("month", value); setParams(next, { replace: true }); };
  const toggleArchive = async () => {
    if (!archiving) return;
    setActionLoading(true);
    try {
      await walletService.archive(archiving.id, !archiving.is_archived);
      toast.success(archiving.is_archived ? "Wallet restored." : "Wallet archived.");
      setArchiving(null);
      load({ silent: true });
    } catch (error) { toast.error(getFriendlyError(error)); }
    finally { setActionLoading(false); }
  };

  const saveSavingsAction = async ({ mode, walletId, loanId, amount, notes, transactionDate }) => {
    try {
      if (mode === "borrow") await savingsService.borrow({ workspaceId: activeWorkspace.id, destinationWalletId: walletId, amount, notes, transactionDate });
      else await savingsService.repay({ loanId, sourceWalletId: walletId, amount, notes, transactionDate });
      toast.success(mode === "borrow" ? "Money borrowed from Savings." : "Savings repayment recorded.");
      await load({ silent: true });
    } catch (error) { toast.error(getFriendlyError(error)); throw error; }
  };

  if (loading) return <WalletsSkeleton />;

  return <div>
    <PageHeader eyebrow={activeWorkspace.name} title="Wallets" description={`Cash, E-wallet, Debit, Credit, and Savings balances for ${monthLabel(selectedMonth)}.${refreshing ? " Updating…" : ""}`} actions={<div className="flex flex-wrap gap-2"><SecondaryButton onClick={() => setMonthOpen(true)}><FiCalendar /> {monthLabel(selectedMonth, true)}</SecondaryButton>{canManage && <PrimaryButton onClick={() => { setEditing(null); setFormOpen(true); }}><FiPlus /> Add wallet</PrimaryButton>}</div>} />

    {historicalSavingsWallet && <section className="mb-6 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-5 shadow-sm dark:border-violet-500/20 dark:from-violet-500/10 dark:via-[#0d1a2b] dark:to-sky-500/10 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-lg shadow-violet-500/15"><FiArchive className="h-6 w-6" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">Workspace Savings</p><div className="mt-1 flex flex-wrap items-end gap-x-5 gap-y-2"><div><p className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{formatCurrency(historicalSavingsWallet.closing_balance ?? historicalSavingsWallet.current_balance, historicalSavingsWallet.currency)}</p><p className="mt-1 text-xs text-slate-500">Closing reserve for {monthLabel(selectedMonth)} · never resets monthly</p></div><div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-white/[0.05]"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Outstanding borrowed</p><p className="mt-0.5 text-sm font-bold text-violet-700 dark:text-violet-300">{formatCurrency(outstanding, currentSavingsWallet?.currency || historicalSavingsWallet.currency)}</p></div></div></div>{canMoveSavings && <div className="grid grid-cols-2 gap-2 sm:w-auto"><PrimaryButton onClick={() => setSavingsAction("borrow")} disabled={Number(currentSavingsWallet?.current_balance || 0) <= 0}><FiArchive /> Borrow</PrimaryButton><SecondaryButton onClick={() => setSavingsAction("repay")} disabled={outstanding <= 0}><FiRefreshCw /> Repay</SecondaryButton></div>}</div></section>}

    {active.length === 0 ? <EmptyState title="Create your first wallet" description="Add Cash, GCash, Maya, a debit account, or a credit card to start managing money." actionLabel={canManage ? "Create wallet" : undefined} onAction={() => setFormOpen(true)} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{active.map((wallet) => {
      const presentation = wallet.is_savings ? walletTypePresentation.savings : walletTypePresentation[wallet.type];
      const Icon = wallet.is_savings ? FiArchive : typeIcons[wallet.type] || FiCreditCard;
      const currentVersion = currentWallets.find((item) => item.id === wallet.id) || wallet;
      return <article key={wallet.id} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${presentation.color} p-5 text-white shadow-lg`}><div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" /><div className="relative"><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><Icon className="h-5 w-5" /></span><span className="rounded-full bg-black/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/75">{presentation.label}</span></div><p className="mt-6 text-xs font-medium text-white/65">{wallet.name}</p><p className={`mt-1 text-3xl font-bold tracking-tight tabular-nums ${Number(wallet.current_balance) < 0 ? "text-rose-100" : ""}`}>{formatCurrency(wallet.current_balance, wallet.currency)}</p><p className="mt-1 text-[10px] text-white/65">Created by: {walletCreatorName(wallet, user.id)}</p><div className="mt-3 grid grid-cols-2 gap-2 text-[9px]"><div className="rounded-xl bg-black/10 p-2"><p className="text-white/55">Opening</p><p className="mt-0.5 font-bold">{formatCurrency(wallet.opening_balance, wallet.currency)}</p></div><div className="rounded-xl bg-black/10 p-2"><p className="text-white/55">Month-end saved</p><p className="mt-0.5 font-bold">{formatCurrency(wallet.month_end_savings, wallet.currency)}</p></div></div><p className="mt-2 text-[9px] text-white/55">Started {wallet.opening_balance_effective_date}</p>{canManage && <div className="mt-5 flex gap-2"><button type="button" onClick={() => { setEditing(currentVersion); setFormOpen(true); }} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-white/15 text-xs font-bold backdrop-blur transition hover:bg-white/25"><FiEdit2 /> Edit</button>{!wallet.is_savings && <button type="button" onClick={() => setArchiving(currentVersion)} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-black/10 text-xs font-bold transition hover:bg-black/20"><FiArchive /> Archive</button>}</div>}</div></article>;
    })}</div>}

    <SavingsLoanHistory loans={loans} currency={activeWorkspace.currency} canRepay={canMoveSavings} onRepay={() => setSavingsAction("repay")} />

    {archived.length > 0 && <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0d1a2b]"><div className="mb-4"><h2 className="text-sm font-bold text-slate-900 dark:text-white">Archived wallets</h2><p className="mt-1 text-xs text-slate-400">Archived wallets remain available in historical transactions and reports.</p></div><div className="space-y-2">{archived.map((wallet) => <div key={wallet.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-white/[0.035]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-500 dark:bg-white/[0.08]"><FiArchive /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{wallet.name}</p><p className="text-[10px] capitalize text-slate-400">{wallet.type} · {formatCurrency(wallet.current_balance, wallet.currency)} · Created by {walletCreatorName(wallet, user.id)}</p></div>{canManage && <SecondaryButton onClick={() => setArchiving(currentWallets.find((item) => item.id === wallet.id) || wallet)} className="h-9"><FiRotateCcw /> Restore</SecondaryButton>}</div>)}</div></section>}

    <WalletFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} workspaceId={activeWorkspace.id} userId={user.id} currency={activeWorkspace.currency} wallet={editing} onSaved={() => load({ silent: true })} />
    <ConfirmDialog open={Boolean(archiving)} onClose={() => setArchiving(null)} onConfirm={toggleArchive} title={archiving?.is_archived ? "Restore wallet?" : "Archive wallet?"} description={archiving?.is_archived ? "The wallet will be available for new transactions again." : "Existing transactions remain visible. The wallet cannot be used for new transactions while archived."} confirmLabel={archiving?.is_archived ? "Restore" : "Archive"} loading={actionLoading} />
    <MonthPickerOverlay open={monthOpen} selectedMonth={selectedMonth} onSelect={setMonth} onClose={() => setMonthOpen(false)} />
    {(savingsAction === "borrow" || savingsAction === "repay") && currentSavingsWallet && <SavingsTransferModal mode={savingsAction} workspaceCurrency={activeWorkspace.currency} savingsWallet={currentSavingsWallet} wallets={regularCurrent} loans={loans} currentUserId={user.id} onClose={() => setSavingsAction(null)} onSubmit={saveSavingsAction} />}
  </div>;
}

function SavingsLoanHistory({ loans, currency, canRepay, onRepay }) {
  if (!loans.length) return null;
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2b]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Savings borrowing history</h2>
          <p className="mt-1 text-xs text-slate-400">Borrowed amounts, repayments, destination wallets, and the member who borrowed.</p>
        </div>
        {canRepay && loans.some((loan) => loan.status === "open" && Number(loan.outstanding_amount) > 0) && <SecondaryButton onClick={onRepay} className="h-9"><FiRefreshCw /> Repay Savings</SecondaryButton>}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {loans.map((loan) => {
          const original = Number(loan.original_amount || 0);
          const outstandingAmount = Number(loan.outstanding_amount || 0);
          const repaid = Math.max(0, original - outstandingAmount);
          const open = loan.status === "open" && outstandingAmount > 0;
          return (
            <article key={loan.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-white/[0.035]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{loan.destination_wallet?.name || "Wallet"}</p>
                  <p className="mt-1 truncate text-[10px] text-slate-400">Borrowed by {loan.borrower?.full_name || loan.borrower?.email || "Workspace member"} · {formatDate(String(loan.borrowed_at || "").slice(0, 10))}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${open ? "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"}`}>{open ? "Open" : "Repaid"}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Borrowed", original],
                  ["Repaid", repaid],
                  ["Outstanding", outstandingAmount],
                ].map(([label, value]) => <div key={label} className="rounded-xl bg-white p-2.5 dark:bg-white/[0.045]"><p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className={`mt-1 truncate text-xs font-bold ${label === "Outstanding" && value > 0 ? "text-amber-600 dark:text-amber-300" : "text-slate-800 dark:text-slate-100"}`}>{formatCurrency(value, currency)}</p></div>)}
              </div>
              {loan.notes && <p className="mt-3 text-[10px] leading-5 text-slate-500 dark:text-slate-400">{loan.notes}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

