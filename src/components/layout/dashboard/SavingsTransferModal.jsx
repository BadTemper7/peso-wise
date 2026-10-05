import React, { useEffect, useMemo, useState } from "react";
import { getTodayValue } from "../../../utils/date";
import { FiArchive, FiArrowDown, FiRefreshCw, FiX } from "react-icons/fi";
import { formatCurrency } from "../../../lib/format";
import { walletOptionLabel } from "../../../utils/presentation";


export default function SavingsTransferModal({
  mode,
  workspaceCurrency = "PHP",
  savingsWallet,
  wallets,
  loans = [],
  defaultWalletId,
  currentUserId,
  onClose,
  onSubmit,
}) {
  const regularWallets = useMemo(() => wallets.filter((wallet) => !wallet.is_savings && !wallet.is_archived), [wallets]);
  const openLoans = useMemo(() => loans.filter((loan) => loan.status === "open" && Number(loan.outstanding_amount) > 0), [loans]);
  const [walletId, setWalletId] = useState(defaultWalletId || regularWallets[0]?.id || "");
  const [loanId, setLoanId] = useState(openLoans[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [transactionDate, setTransactionDate] = useState(getTodayValue());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setWalletId(defaultWalletId || regularWallets[0]?.id || "");
    setLoanId(openLoans[0]?.id || "");
    setAmount("");
    setNotes("");
    setTransactionDate(getTodayValue());
  }, [mode, defaultWalletId, regularWallets, openLoans]);

  const selectedWallet = regularWallets.find((wallet) => wallet.id === walletId);
  const selectedLoan = openLoans.find((loan) => loan.id === loanId);
  const numeric = Number(amount || 0);
  const limit = mode === "borrow"
    ? Number(savingsWallet?.current_balance ?? savingsWallet?.balance ?? 0)
    : Math.min(Number(selectedLoan?.outstanding_amount || 0), Math.max(Number(selectedWallet?.current_balance ?? selectedWallet?.balance ?? 0), 0));
  const invalid = numeric <= 0 || numeric > limit || !walletId || (mode === "repay" && !loanId);

  const submit = async (event) => {
    event.preventDefault();
    if (invalid) return;
    setSubmitting(true);
    try {
      await onSubmit({
        mode,
        walletId,
        loanId: mode === "repay" ? loanId : undefined,
        amount: numeric,
        notes: notes.trim(),
        transactionDate,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!savingsWallet) return null;
  const borrowing = mode === "borrow";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0d1a2b] sm:rounded-3xl">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400" />
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{borrowing ? "Borrow from Savings" : "Repay Savings"}</h2>
            <p className="mt-1 text-xs text-slate-400">{borrowing ? "Move available Savings into a regular wallet" : "Return borrowed money to Savings"}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/5 dark:hover:text-white"><FiX className="h-5 w-5" /></button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 dark:border-violet-500/15 dark:bg-violet-400/[0.06]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-white"><FiArchive className="h-[18px] w-[18px]" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600/70 dark:text-violet-300/70">Savings balance</p>
                <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{formatCurrency(savingsWallet.current_balance ?? savingsWallet.balance, workspaceCurrency)}</p>
              </div>
            </div>
          </div>

          {mode === "repay" && (
            <div>
              <label htmlFor="savings-loan" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Borrowing record</label>
              <select id="savings-loan" value={loanId} onChange={(event) => { setLoanId(event.target.value); const next = openLoans.find((loan) => loan.id === event.target.value); if (next?.destination_wallet_id) setWalletId(next.destination_wallet_id); }} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-[#0f1d30] dark:text-slate-100">
                {openLoans.length === 0 && <option value="">No outstanding borrowing</option>}
                {openLoans.map((loan) => <option key={loan.id} value={loan.id}>{loan.destination_wallet?.name || "Wallet"} — {formatCurrency(loan.outstanding_amount, workspaceCurrency)} outstanding</option>)}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="savings-wallet" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{borrowing ? "Destination wallet" : "Repay from wallet"}</label>
            <select id="savings-wallet" value={walletId} onChange={(event) => setWalletId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-[#0f1d30] dark:text-slate-100">
              <option value="">Select wallet</option>
              {regularWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{walletOptionLabel(wallet, currentUserId)}</option>)}
            </select>
            {selectedWallet && <p className="mt-1.5 text-[10px] text-slate-400">Available wallet balance: {formatCurrency(selectedWallet.current_balance ?? selectedWallet.balance, workspaceCurrency)}</p>}
          </div>

          <div>
            <label htmlFor="savings-amount" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₱</span>
              <input id="savings-amount" type="number" inputMode="decimal" min="0" step="0.01" autoFocus value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-lg font-bold tabular-nums text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-white/[0.03] dark:text-white" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3"><p className="text-[10px] text-slate-400">Maximum {formatCurrency(limit, workspaceCurrency)}</p>{limit > 0 && <button type="button" onClick={() => setAmount(String(limit))} className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">Use maximum</button>}</div>
            {numeric > limit && <p className="mt-2 text-xs font-medium text-rose-500">Amount exceeds the available limit.</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="savings-date" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Date</label><input id="savings-date" type="date" max={getTodayValue()} value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-[#0f1d30] dark:text-slate-100" /></div>
            <div><label htmlFor="savings-note" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Note <span className="font-normal text-slate-400">(optional)</span></label><input id="savings-note" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={80} placeholder="Reason or reference" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-[#0f1d30] dark:text-slate-100" /></div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-[10px] leading-5 text-slate-500 dark:bg-white/[0.035] dark:text-slate-400"><FiArrowDown className="h-4 w-4 shrink-0 text-violet-500" />This is recorded as a transfer. It does not count as income or expense and does not change the workspace’s combined money.</div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={invalid || submitting} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 text-sm font-bold text-white shadow-lg shadow-violet-500/10 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"><FiRefreshCw className="h-4 w-4" />{submitting ? "Saving…" : borrowing ? "Borrow" : "Repay"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
