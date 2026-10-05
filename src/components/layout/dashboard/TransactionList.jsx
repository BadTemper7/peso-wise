import React from "react";
import { Link } from "react-router";
import {
  FiArchive,
  FiArrowDownLeft,
  FiCheckCircle,
  FiCoffee,
  FiCreditCard,
  FiPlusCircle,
  FiDollarSign,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiSliders,
  FiTruck,
  FiTv,
  FiZap,
} from "react-icons/fi";
import { formatPeso } from "../../../lib/format";

const categoryIcons = {
  Food: FiCoffee,
  Transport: FiTruck,
  Bills: FiZap,
  Groceries: FiShoppingBag,
  Income: FiDollarSign,
  Transfer: FiRefreshCw,
  Subscription: FiTv,
  Savings: FiArchive,
  Payment: FiCheckCircle,
  Receive: FiArrowDownLeft,
  "Top Up": FiPlusCircle,
  "Month-end Savings": FiArchive,
  "Borrowed from Savings": FiArrowDownLeft,
  "Savings Repayment": FiRefreshCw,
};

const categoryTone = {
  Food: "bg-orange-100 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300",
  Transport: "bg-blue-100 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300",
  Bills: "bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
  Groceries: "bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  Income: "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
  Transfer: "bg-cyan-100 text-cyan-600 dark:bg-cyan-400/15 dark:text-cyan-300",
  Subscription: "bg-rose-100 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300",
  Savings: "bg-teal-100 text-teal-600 dark:bg-teal-400/15 dark:text-teal-300",
  Payment: "bg-sky-100 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
  Receive: "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
  "Top Up": "bg-cyan-100 text-cyan-600 dark:bg-cyan-400/15 dark:text-cyan-300",
  "Month-end Savings": "bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  "Borrowed from Savings": "bg-sky-100 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
  "Savings Repayment": "bg-indigo-100 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300",
};

const TransactionList = ({
  transactions,
  walletName,
  compact = false,
  fillHeight = false,
  maxItems,
  monthLabel,
}) => {
  const visibleTransactions = typeof maxItems === "number" ? transactions.slice(0, maxItems) : transactions;

  return (
    <section
      className={[
        "w-full",
        compact
          ? ""
          : "rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-[#0d1a2b] dark:shadow-none sm:p-6",
        fillHeight ? "flex h-full min-h-0 flex-col" : "",
      ].join(" ")}
    >
      <div className="mb-3 flex w-full items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className={`${compact ? "text-base" : "text-sm"} font-bold text-slate-950 dark:text-white`}>Transactions</h2>
          {(fillHeight || !compact) && (
            <p className="mt-1 truncate text-[11px] text-slate-400 dark:text-slate-500">
              {walletName ? `${walletName} activity${monthLabel ? ` · ${monthLabel}` : ""}` : "Latest activity across your wallets"}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {compact && (
            <>
              <button
                type="button"
                aria-label="Search transactions"
                title="Search transactions"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                <FiSearch className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Filter transactions"
                title="Filter transactions"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                <FiSliders className="h-4 w-4" />
              </button>
            </>
          )}
          <Link
            to="/transactions"
            className={`${compact ? "ml-1 hidden sm:inline" : ""} shrink-0 text-xs font-semibold text-teal-600 transition hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300`}
          >
            View all
          </Link>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className={`text-center ${fillHeight ? "flex flex-1 flex-col items-center justify-center" : "py-10"}`}>
          <FiCreditCard className="h-6 w-6 text-slate-300 dark:text-slate-700" />
          <p className="mt-2 text-sm text-slate-400">No transactions for this wallet yet.</p>
        </div>
      ) : (
        <div
          className={[
            compact ? "w-full space-y-2" : "w-full divide-y divide-slate-100 dark:divide-slate-800",
            fillHeight ? "min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin" : "",
          ].join(" ")}
        >
          {visibleTransactions.map((transaction) => {
            const transfer = transaction.type === "transfer";
            const topUp = transaction.category === "Top Up";
            const received = transaction.category === "Receive";
            const income = transaction.amount > 0 && !transfer && !topUp && !received;
            const expense = transaction.amount < 0 && !transfer;
            const positive = transaction.amount > 0;
            const Icon = categoryIcons[transaction.category] ?? FiCreditCard;
            const tone = categoryTone[transaction.category] ?? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300";

            return (
              <div
                key={transaction.id}
                className={
                  compact
                    ? "flex w-full items-center gap-3 rounded-2xl bg-slate-100/75 px-3.5 py-2.5 transition hover:bg-slate-100 dark:bg-white/[0.045] dark:hover:bg-white/[0.07]"
                    : "flex w-full items-center gap-3 py-3.5"
                }
              >
                <div className={`flex ${compact ? "h-9 w-9 rounded-full" : "h-10 w-10 rounded-xl"} shrink-0 items-center justify-center ${tone}`}>
                  <Icon className="h-[16px] w-[16px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`${compact ? "text-xs" : "text-sm"} truncate font-semibold text-slate-900 dark:text-slate-100`}>{transaction.name}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-400 dark:text-slate-500">
                    {transaction.date} · {transaction.category}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`${compact ? "text-xs" : "text-sm"} font-bold tabular-nums ${
                    expense
                      ? "text-rose-600 dark:text-rose-400"
                      : transfer || topUp
                        ? "text-cyan-600 dark:text-cyan-400"
                        : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {positive ? "+" : "−"}{formatPeso(Math.abs(transaction.amount))}
                  </p>
                  <p className="mt-0.5 text-[9px] text-slate-400 dark:text-slate-500">
                    {transaction.transfer_kind === "month_end_savings" ? "Month-end transfer" : transaction.transfer_kind === "savings_borrow" ? "Borrowed from Savings" : transaction.transfer_kind === "savings_repayment" ? "Savings repayment" : transfer ? "Transfer" : topUp ? "Top up" : received ? "Received" : income ? "Income" : "Expense"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default TransactionList;
