import React from "react";
import { FiMinus, FiPlus, FiRepeat } from "react-icons/fi";
import { formatPeso } from "../../../lib/format";
import WalletIcon from "./WalletIcon";

const BalanceCard = ({ wallet, onTransfer, onAddIncome, onAddExpense }) => {
  if (!wallet) return null;
  const isCredit = wallet.type === "credit";
  const isNegative = wallet.balance < 0;

  return (
    <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#082f62] via-[#0a477f] to-[#087b79] p-6 text-white shadow-[0_20px_60px_rgba(7,46,91,0.18)] sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-teal-300/15 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${wallet.color} text-white shadow-lg`}>
              <WalletIcon type={wallet.icon} className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/55">
                {isCredit ? "Outstanding" : "Available balance"}
              </p>
              <p className="mt-0.5 text-sm font-bold">{wallet.name}</p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/65 ring-1 ring-inset ring-white/10">
            {wallet.type}
          </span>
        </div>

        <h2 className={`mt-7 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl ${isNegative ? "text-rose-200" : "text-white"}`}>
          {isCredit && isNegative ? "−" : ""}{formatPeso(Math.abs(wallet.balance), { decimals: 2 })}
        </h2>

        <div className="mt-7 flex flex-wrap gap-2">
          <button type="button" onClick={onTransfer} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#0b4d86] transition hover:bg-slate-100">
            <FiRepeat className="h-4 w-4" /> Transfer
          </button>
          <button type="button" onClick={onAddIncome} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/15">
            <FiPlus className="h-4 w-4" /> Income
          </button>
          <button type="button" onClick={onAddExpense} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/15">
            <FiMinus className="h-4 w-4" /> Expense
          </button>
        </div>
      </div>
    </article>
  );
};

export default BalanceCard;
