export const walletTypePresentation = {
  cash: { color: "from-emerald-400 to-teal-600", icon: "cash", label: "Cash" },
  ewallet: { color: "from-sky-400 to-blue-600", icon: "mobile", label: "E-wallet" },
  debit: { color: "from-amber-400 to-orange-500", icon: "card", label: "Debit" },
  credit: { color: "from-rose-400 to-red-600", icon: "card", label: "Credit" },
  savings: { color: "from-violet-500 via-indigo-500 to-sky-500", icon: "savings", label: "Savings" },
};

export function walletCreatorName(wallet, currentUserId) {
  if (wallet?.is_savings && wallet?.is_system_generated) return "PesoWise";
  if (currentUserId && wallet?.created_by === currentUserId) return "You";
  return wallet?.creator?.full_name || wallet?.creator?.email || "Workspace member";
}

export function walletOptionLabel(wallet, currentUserId) {
  return `${wallet.name} — Created by ${walletCreatorName(wallet, currentUserId)}`;
}

export function presentWallet(wallet) {
  const presentation = wallet.is_savings
    ? walletTypePresentation.savings
    : walletTypePresentation[wallet.type] || walletTypePresentation.cash;
  return {
    ...wallet,
    balance: Number(wallet.closing_balance ?? wallet.current_balance ?? wallet.balance ?? 0),
    creatorName: walletCreatorName(wallet),
    ...presentation,
  };
}

export function transactionDisplay(transaction, activeWalletId) {
  if (transaction.type === "transfer") {
    const incoming = transaction.to_wallet_id === activeWalletId;
    const transferLabels = {
      month_end_savings: incoming ? `Saved from ${transaction.from_wallet?.name || "wallet"}` : "Moved to Savings",
      savings_borrow: incoming ? "Borrowed from Savings" : `Borrowed to ${transaction.to_wallet?.name || "wallet"}`,
      savings_repayment: incoming ? `Savings repayment from ${transaction.from_wallet?.name || "wallet"}` : "Repay Savings",
    };
    const categories = {
      month_end_savings: "Month-end Savings",
      savings_borrow: "Borrowed from Savings",
      savings_repayment: "Savings Repayment",
    };
    return {
      ...transaction,
      name: transaction.description || transferLabels[transaction.transfer_kind] || (incoming ? `Transfer from ${transaction.from_wallet?.name || "wallet"}` : `Transfer to ${transaction.to_wallet?.name || "wallet"}`),
      category: categories[transaction.transfer_kind] || "Transfer",
      date: new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(`${transaction.transaction_date}T00:00:00`)),
      amount: incoming ? Number(transaction.amount) : -Number(transaction.amount),
    };
  }
  return {
    ...transaction,
    name: transaction.description || transaction.category?.name || transaction.type,
    category: transaction.category?.name || (transaction.type === "income" ? "Income" : "Expense"),
    date: new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(`${transaction.transaction_date}T00:00:00`)),
    amount: transaction.type === "income" ? Number(transaction.amount) : -Number(transaction.amount),
  };
}
