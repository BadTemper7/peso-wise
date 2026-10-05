import React, { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { formatPeso } from "../../../lib/format";
import WalletIcon from "./WalletIcon";

const SOURCES = ["Cash deposit", "Bank transfer", "GCash", "Maya", "Other"];

const TopUpModal = ({ wallet, onClose, onTopUp }) => {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("Cash deposit");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const numeric = Number(amount) || 0;
  const invalid = numeric <= 0;

  if (!wallet) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (invalid) return;
    setSubmitting(true);
    try {
      await onTopUp({ walletId: wallet.id, amount: numeric, source, note: note.trim() });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0d1a2b] sm:rounded-3xl">
        <div className="h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-400" />
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top up wallet</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Add funds and keep your balance up to date</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close top up" className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/5 dark:hover:text-white">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-white/[0.03]">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${wallet.color} text-white`}>
              <WalletIcon type={wallet.icon} className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Top up</p>
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{wallet.name}</p>
              <p className="text-[11px] text-slate-400">Current balance {formatPeso(wallet.balance, { decimals: 2 })}</p>
            </div>
          </div>

          <div>
            <label htmlFor="topup-amount" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₱</span>
              <input
                id="topup-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                autoFocus
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-lg font-bold tabular-nums text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-slate-600"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[500, 1000, 2000, 5000].map((value) => (
                <button key={value} type="button" onClick={() => setAmount(String(value))} className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-cyan-500/30 dark:hover:text-cyan-300">
                  {formatPeso(value)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="topup-source" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Funding source</label>
            <select
              id="topup-source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-[#0f1d30] dark:text-slate-100"
            >
              {SOURCES.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="topup-note" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Note <span className="font-normal text-slate-400">(optional)</span></label>
            <input
              id="topup-note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={60}
              placeholder="e.g. cash-in"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-white/[0.03] dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={invalid || submitting} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 text-sm font-bold text-white shadow-lg shadow-cyan-500/10 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">
              <FiPlus className="h-4 w-4" />
              {submitting ? "Adding funds..." : "Top up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopUpModal;
