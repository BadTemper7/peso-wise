import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiFilter,
  FiTrendingUp,
} from "react-icons/fi";
import { formatPeso } from "../../../lib/format";

const MONTH_INDEX = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const compactPeso = (value) => {
  if (value >= 1000) return `₱${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `₱${value}`;
};

const ChartTooltip = ({ active, payload, label, reportRange }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-[#0b1727]/95">
      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
        {reportRange === "daily" ? `Day ${label}` : label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-slate-950 dark:text-white">
        {formatPeso(payload[0].value)}
      </p>
      <p className="mt-0.5 text-[9px] text-slate-400">Expenses</p>
    </div>
  );
};

const getDaysInMonth = (monthValue) => {
  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
};

const getVisibleDayCount = (monthValue) => {
  const [year, month] = monthValue.split("-").map(Number);
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  return isCurrentMonth ? now.getDate() : getDaysInMonth(monthValue);
};

const parseTransactionDay = (dateLabel) => {
  const [monthShort, rawDay] = String(dateLabel ?? "").split(" ");
  if (!(monthShort in MONTH_INDEX)) return null;
  const day = Number(rawDay);
  return Number.isFinite(day) ? day : null;
};

const buildDailyData = (transactions, monthValue) => {
  const dayCount = getVisibleDayCount(monthValue);
  const totals = new Map();

  transactions.forEach((transaction) => {
    // All wallet-to-wallet movements, including automatic Savings transfers,
    // borrowing, and repayments, must stay out of expense reporting.
    if (transaction.amount >= 0 || transaction.type === "transfer") return;
    const day = parseTransactionDay(transaction.date);
    if (!day || day > dayCount) return;
    totals.set(day, (totals.get(day) ?? 0) + Math.abs(transaction.amount));
  });

  return Array.from({ length: dayCount }, (_, index) => ({
    period: String(index + 1),
    amount: totals.get(index + 1) ?? 0,
  }));
};

const buildWeeklyData = (dailyData) => {
  const weekCount = Math.max(1, Math.ceil(dailyData.length / 7));
  return Array.from({ length: weekCount }, (_, weekIndex) => ({
    period: `Week ${weekIndex + 1}`,
    amount: dailyData
      .slice(weekIndex * 7, weekIndex * 7 + 7)
      .reduce((total, item) => total + item.amount, 0),
  }));
};

const chartTypes = [
  { value: "bar", label: "Bar", icon: FiBarChart2 },
  { value: "line", label: "Line", icon: FiTrendingUp },
  { value: "area", label: "Area", icon: FiActivity },
];

const SpendingChart = ({ transactions = [], monthLabel, selectedMonth, walletName }) => {
  const [reportRange, setReportRange] = useState("weekly");
  const [chartType, setChartType] = useState("bar");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    if (!filterOpen) return undefined;

    const handlePointerDown = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setFilterOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filterOpen]);

  const dailyData = useMemo(
    () => buildDailyData(transactions, selectedMonth),
    [transactions, selectedMonth],
  );

  const chartData = useMemo(
    () => (reportRange === "daily" ? dailyData : buildWeeklyData(dailyData)),
    [dailyData, reportRange],
  );

  const totalExpenses = useMemo(
    () => chartData.reduce((total, item) => total + item.amount, 0),
    [chartData],
  );

  const commonChartProps = {
    data: chartData,
    margin: { top: 14, right: 10, left: -8, bottom: 0 },
  };

  const sharedAxes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" />
      <XAxis
        dataKey="period"
        axisLine={false}
        tickLine={false}
        interval={reportRange === "daily" && chartData.length > 18 ? 2 : 0}
        tick={{ fill: "var(--muted)", fontSize: 10 }}
        dy={8}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: "var(--muted)", fontSize: 10 }}
        tickFormatter={compactPeso}
        width={54}
      />
      <Tooltip
        cursor={{ fill: "rgba(148, 163, 184, 0.06)" }}
        content={<ChartTooltip reportRange={reportRange} />}
      />
    </>
  );

  const animationKey = `${selectedMonth}-${walletName}-${reportRange}-${chartType}-${transactions.length}`;

  const renderChart = () => {
    if (chartType === "line") {
      return (
        <LineChart key={animationKey} {...commonChartProps}>
          {sharedAxes}
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#14b8a6"
            strokeWidth={3}
            dot={{ r: reportRange === "daily" ? 2 : 4, fill: "#14b8a6", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#14b8a6", stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive
            animationBegin={80}
            animationDuration={850}
            animationEasing="ease-out"
          />
        </LineChart>
      );
    }

    if (chartType === "area") {
      return (
        <AreaChart key={animationKey} {...commonChartProps}>
          <defs>
            <linearGradient id="spendingArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.42} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          {sharedAxes}
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#14b8a6"
            strokeWidth={3}
            fill="url(#spendingArea)"
            isAnimationActive
            animationBegin={80}
            animationDuration={850}
            animationEasing="ease-out"
          />
        </AreaChart>
      );
    }

    return (
      <BarChart key={animationKey} {...commonChartProps} barCategoryGap={reportRange === "daily" ? "18%" : "30%"}>
        <defs>
          <linearGradient id="spendingBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#0f6ea8" />
          </linearGradient>
        </defs>
        {sharedAxes}
        <Bar
          dataKey="amount"
          fill="url(#spendingBar)"
          radius={[8, 8, 3, 3]}
          maxBarSize={reportRange === "daily" ? 24 : 58}
          isAnimationActive
          animationBegin={80}
          animationDuration={850}
          animationEasing="ease-out"
        />
      </BarChart>
    );
  };

  return (
    <section className="flex h-full min-h-[360px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-[#0d1a2b] dark:shadow-none sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Spending report</h2>
            <span className="max-w-[140px] truncate rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
              {walletName}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {reportRange === "daily" ? "Daily" : "Weekly"} expenses for {monthLabel}
          </p>
          <p className="mt-2 text-lg font-bold tracking-tight text-slate-950 dark:text-white">
            {formatPeso(totalExpenses)}
            <span className="ml-1.5 text-[10px] font-medium text-slate-400">total expenses</span>
          </p>
        </div>

        <div ref={filterRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
            aria-haspopup="dialog"
            className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold shadow-sm transition sm:h-10 sm:rounded-xl ${
              filterOpen
                ? "border-teal-300 bg-teal-50 text-teal-700 ring-2 ring-teal-500/10 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-300"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700 dark:border-slate-700 dark:bg-white/[0.035] dark:text-slate-200 dark:hover:border-teal-500/30 dark:hover:bg-teal-500/10 dark:hover:text-teal-300"
            }`}
          >
            <FiFilter className="h-4 w-4" />
            <span>Filter</span>
          </button>

          {filterOpen && (
            <div
              role="dialog"
              aria-label="Chart filters"
              className="absolute right-0 top-[calc(100%+0.55rem)] z-40 w-[min(290px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-[#101d2e] dark:shadow-[0_22px_60px_rgba(0,0,0,0.34)]"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Chart filters</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">Adjust the report view</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReportRange("weekly");
                    setChartType("bar");
                  }}
                  className="rounded-lg px-2 py-1 text-[10px] font-bold text-teal-600 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-400/10"
                >
                  Reset
                </button>
              </div>

              <div className="rounded-xl bg-slate-50 p-2 dark:bg-white/[0.035]">
                <div className="mb-2 flex items-center gap-2 px-1">
                  <FiCalendar className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Report interval</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["daily", "weekly"].map((range) => {
                    const active = reportRange === range;
                    return (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setReportRange(range)}
                        className={`flex h-10 items-center justify-between rounded-xl border px-3 text-xs font-semibold capitalize transition ${
                          active
                            ? "border-teal-300 bg-white text-teal-700 shadow-sm dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-300"
                            : "border-transparent bg-white/70 text-slate-600 hover:border-slate-200 dark:bg-white/[0.035] dark:text-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <span>{range}</span>
                        {active && <FiCheck className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 p-2 dark:bg-white/[0.035]">
                <div className="mb-2 flex items-center gap-2 px-1">
                  <FiBarChart2 className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Chart type</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {chartTypes.map(({ value, label, icon: Icon }) => {
                    const active = chartType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setChartType(value)}
                        aria-label={`Show ${label.toLowerCase()} chart`}
                        className={`flex min-h-[62px] flex-col items-center justify-center gap-1.5 rounded-xl border text-[10px] font-bold transition ${
                          active
                            ? "border-teal-300 bg-white text-teal-700 shadow-sm dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-300"
                            : "border-transparent bg-white/70 text-slate-500 hover:border-slate-200 hover:text-slate-800 dark:bg-white/[0.035] dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-slate-900 text-center text-xs font-bold leading-none text-white transition hover:bg-slate-800 dark:bg-teal-500 dark:text-white dark:hover:bg-teal-400"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-[260px] min-h-[260px] w-full sm:h-[300px] sm:min-h-[300px] lg:min-h-0 lg:flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default SpendingChart;
