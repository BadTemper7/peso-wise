import React from "react";
import { Link } from "react-router";
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiBarChart2,
  FiCreditCard,
  FiFileText,
  FiPlus,
  FiSettings,
  FiX,
} from "react-icons/fi";

const MoreActionsModal = ({ walletName, onClose, onTransfer, onReceive, onTopUp }) => {
  const quickActions = [
    { label: "Transfer money", description: "Move funds between wallets", icon: FiArrowUpRight, action: onTransfer, tone: "text-sky-600 bg-sky-100 dark:bg-sky-400/15 dark:text-sky-300" },
    { label: "Receive money", description: `Add incoming money to ${walletName}`, icon: FiArrowDownLeft, action: onReceive, tone: "text-emerald-600 bg-emerald-100 dark:bg-emerald-400/15 dark:text-emerald-300" },
    { label: "Top up wallet", description: `Add funds to ${walletName}`, icon: FiPlus, action: onTopUp, tone: "text-cyan-600 bg-cyan-100 dark:bg-cyan-400/15 dark:text-cyan-300" },
  ];

  const links = [
    { label: "Transactions", description: "View and manage activity", icon: FiFileText, to: "/transactions" },
    { label: "Wallets", description: "Manage accounts and cards", icon: FiCreditCard, to: "/wallets" },
    { label: "Reports", description: "Review spending reports", icon: FiBarChart2, to: "/reports" },
    { label: "Settings", description: "Manage app preferences", icon: FiSettings, to: "/settings" },
  ];

  const runAction = (action) => {
    onClose();
    action();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0d1a2b] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">More actions</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Quick tools for {walletName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close more actions" className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/5 dark:hover:text-white">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Money actions</p>
            <div className="space-y-2">
              {quickActions.map(({ label, description, icon: Icon, action, tone }) => (
                <button key={label} type="button" onClick={() => runAction(action)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-teal-300 hover:bg-teal-50/50 dark:border-slate-700 dark:bg-white/[0.03] dark:hover:border-teal-500/25 dark:hover:bg-teal-400/[0.06]">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-400">{description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Go to</p>
            <div className="grid grid-cols-2 gap-2">
              {links.map(({ label, description, icon: Icon, to }) => (
                <Link key={label} to={to} onClick={onClose} className="rounded-2xl border border-slate-200 p-3 transition hover:border-teal-300 hover:bg-teal-50/50 dark:border-slate-700 dark:hover:border-teal-500/25 dark:hover:bg-teal-400/[0.06]">
                  <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span className="mt-2 block text-xs font-bold text-slate-900 dark:text-white">{label}</span>
                  <span className="mt-0.5 block text-[9px] leading-4 text-slate-400">{description}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoreActionsModal;
