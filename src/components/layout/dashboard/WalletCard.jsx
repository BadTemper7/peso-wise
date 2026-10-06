import React from "react";
import { FiCheck, FiMoreHorizontal } from "react-icons/fi";
import { formatPeso } from "../../../lib/format";
import WalletIcon from "./WalletIcon";

const accountMeta = {
  cash: "CASH",
  gcash: "•••• 2088",
  credit: "•••• 2584",
  bpi: "•••• 8541",
};

const WalletCard = ({
  wallet,
  active,
  onClick,
  hideBalance = false,
  mobileSingle = false,
  fluid = false,
}) => {
  const isCredit = wallet.type === "credit";
  const isNegative = wallet.balance < 0;
  const cardAmount = `${isCredit && isNegative ? "−" : ""}${formatPeso(Math.abs(wallet.balance), { decimals: 2 })}`;

  const sizeClass = mobileSingle
    ? "h-[158px] w-full max-w-[286px] rounded-[20px] p-4"
    : fluid
      ? "h-[134px] min-w-[185px] max-w-[235px] flex-[1_0_185px] snap-start rounded-[16px] p-3.5"
      : "h-[126px] w-[158px] rounded-[16px] p-3 sm:h-[134px] sm:w-[175px] sm:p-3.5";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative flex shrink-0 snap-start flex-col overflow-hidden bg-gradient-to-br ${wallet.color} ${sizeClass} text-left text-white shadow-[0_10px_26px_rgba(15,23,42,0.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.22)] focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/25 ${
        active && !mobileSingle
          ? "ring-1 ring-white/80 ring-offset-2 ring-offset-[var(--app-bg)]"
          : ""
      }`}
    >
      <div className="pointer-events-none absolute -right-9 -top-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-8 h-28 w-28 rounded-full bg-black/20 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-black/[0.08]" />

      <div className="relative flex items-start justify-between gap-2">
        <p
          className={`min-w-0 truncate font-semibold leading-none text-white/95 ${mobileSingle ? "text-xs" : "text-[10px] sm:text-[11px]"}`}
        >
          {wallet.name}
        </p>
        <span className="-mr-0.5 -mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/90 transition group-hover:bg-black/10">
          {active && !mobileSingle ? (
            <FiCheck className="h-3 w-3" />
          ) : (
            <FiMoreHorizontal className="h-3.5 w-3.5" />
          )}
        </span>
      </div>

      <div className={mobileSingle ? "relative mt-5" : "relative mt-3"}>
        <p
          className={`${mobileSingle ? "text-[10px]" : "text-[9px]"} font-medium text-white/60`}
        >
          Balance
        </p>
        <p
          className={`mt-0.5 truncate font-semibold tracking-tight tabular-nums ${mobileSingle ? "text-xl" : "text-[14px] sm:text-[15px]"}`}
        >
          {hideBalance ? "••••••" : cardAmount}
        </p>
      </div>

      <div className="relative mt-auto min-w-0">
        <p
          className={`${mobileSingle ? "text-[9px]" : "text-[8px]"} truncate font-medium text-white/65`}
        >
          Created by:{" "}
          {wallet.creatorName ||
            wallet.creator?.full_name ||
            "Workspace member"}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span
            className={`flex h-5 min-w-0 items-center gap-1.5 font-semibold tracking-[0.04em] text-white/70 ${mobileSingle ? "text-[9px]" : "text-[8px] sm:text-[9px]"}`}
          >
            <WalletIcon
              type={wallet.icon}
              className={mobileSingle ? "h-4 w-4" : "h-3.5 w-3.5"}
            />
            <span className="truncate">
              {wallet.is_savings
                ? "SAVINGS"
                : (accountMeta[wallet.id] ?? wallet.type.toUpperCase())}
            </span>
          </span>
          <span
            className={`${mobileSingle ? "text-[9px]" : "text-[8px]"} shrink-0 font-bold uppercase tracking-[0.12em] text-white/55`}
          >
            {wallet.is_savings
              ? "Reserve"
              : wallet.type === "credit"
                ? "Card"
                : "Wallet"}
          </span>
        </div>
      </div>
    </button>
  );
};

export default WalletCard;
