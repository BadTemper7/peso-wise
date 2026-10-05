import React, { useMemo, useState } from "react";
import { FiArrowDown, FiX } from "react-icons/fi";
import { formatPeso } from "../../../lib/format";
import WalletIcon from "./WalletIcon";

const TransferModal = ({ wallets, fromId, onClose, onTransfer }) => {
  const [toId, setToId] = useState(wallets.find((wallet) => wallet.id !== fromId)?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = wallets.find((wallet) => wallet.id === fromId);
  const to = wallets.find((wallet) => wallet.id === toId);
  const numeric = Number(amount) || 0;
  const spendableBalance = Math.max(from?.balance ?? 0, 0);
  const insufficient = numeric > spendableBalance;
  const invalid = numeric <= 0 || !toId || insufficient;

  const quickAmounts = useMemo(
    () => [500, 1000, 2000, 5000].filter((value) => value <= spendableBalance),
    [spendableBalance],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (invalid) return;
    setSubmitting(true);
    try {
      await onTransfer({ fromId, toId, amount: numeric, note });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!from) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0d1a2b] sm:rounded-3xl"
      >
        <div className="h-1 bg-gradient-to-r from-[#0b4d86] via-teal-400 to-amber-300" />
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Transfer money</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Move funds between your PesoWise wallets</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transfer"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${from.color} text-white`}>
                <WalletIcon type={from.icon} className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">From</p>
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{from.name}</p>
                <p className="text-[11px] text-slate-400">{formatPeso(from.balance, { decimals: 2 })} available</p>
              </div>
            </div>

            <div className="my-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-teal-600 dark:border-slate-700 dark:bg-[#0d1a2b] dark:text-teal-400">
                <FiArrowDown className="h-3.5 w-3.5" />
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">To</p>
            <div className="grid grid-cols-2 gap-2">
              {wallets.filter((wallet) => wallet.id !== fromId).map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  onClick={() => setToId(wallet.id)}
                  className={`flex min-w-0 items-center gap-2 rounded-xl border p-2.5 text-left transition ${
                    toId === wallet.id
                      ? "border-teal-300 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-400/10"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-white/[0.02] dark:hover:border-slate-600"
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${wallet.color} text-white`}>
                    <WalletIcon type={wallet.icon} className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{wallet.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="transfer-amount" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₱</span>
              <input
                id="transfer-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                autoFocus
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-lg font-bold tabular-nums text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-slate-600"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickAmounts.map((value) => (
                <button key={value} type="button" onClick={() => setAmount(String(value))} className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-teal-500/30 dark:hover:text-teal-300">
                  {formatPeso(value)}
                </button>
              ))}
              {spendableBalance > 0 && (
                <button type="button" onClick={() => setAmount(String(spendableBalance))} className="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">Max</button>
              )}
            </div>
            {insufficient && <p className="mt-2 text-xs font-medium text-rose-500">Amount exceeds available balance.</p>}
          </div>

          <div>
            <label htmlFor="transfer-note" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Note <span className="font-normal text-slate-400">(optional)</span></label>
            <input
              id="transfer-note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={60}
              placeholder="e.g. allowance"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-white/[0.03] dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={invalid || submitting} className="h-11 rounded-xl bg-gradient-to-r from-[#0b4d86] to-teal-500 text-sm font-bold text-white shadow-lg shadow-teal-500/10 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? "Transferring..." : `Transfer to ${to?.name ?? "wallet"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;
