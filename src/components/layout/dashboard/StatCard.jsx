import React from "react";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

const toneMap = {
  income: {
    icon: FiTrendingUp,
    bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
  },
  expense: {
    icon: FiTrendingDown,
    bg: "bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300",
  },
  saving: {
    icon: FiArrowUpRight,
    bg: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300",
  },
};

const StatCard = ({ label, value, change, trend = "up", tone = "income" }) => {
  const settings = toneMap[tone] ?? toneMap.income;
  const Icon = settings.icon;
  const TrendIcon = trend === "up" ? FiArrowUpRight : FiArrowDownRight;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-[#0d1a2b] dark:shadow-none sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {value}
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${settings.bg}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        <span
          className={`inline-flex items-center gap-1 font-semibold ${
            trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          {change}
        </span>
        <span>vs last month</span>
      </div>
    </article>
  );
};

export default StatCard;
