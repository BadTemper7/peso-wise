import React from "react";
import { FiArrowUpRight, FiAlertCircle } from "react-icons/fi";
import { formatPeso } from "../../../lib/format";

const BudgetList = ({ budgets }) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-[#0d1a2b] dark:shadow-none sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Monthly budgets</h2>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Keep spending within your limits</p>
        </div>
        <button type="button" className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400">
          Manage <FiArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-5">
        {budgets.map((budget) => {
          const rawPct = (budget.spent / budget.limit) * 100;
          const pct = Math.min(rawPct, 100);
          const over = rawPct >= 100;
          const close = rawPct >= 85 && !over;

          return (
            <div key={budget.name}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{budget.name}</p>
                <p className="shrink-0 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                  {formatPeso(budget.spent)} / {formatPeso(budget.limit)}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    over ? "bg-rose-500" : close ? "bg-amber-400" : "bg-teal-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {over && (
                <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-rose-500">
                  <FiAlertCircle className="h-3 w-3" /> Budget exceeded
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BudgetList;
