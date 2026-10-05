export const walletTypePresentation = {
  cash: { color: "from-emerald-400 to-teal-600", icon: "cash", label: "Cash" },
  ewallet: { color: "from-sky-400 to-blue-600", icon: "mobile", label: "E-wallet" },
  debit: { color: "from-amber-400 to-orange-500", icon: "card", label: "Debit" },
  credit: { color: "from-rose-400 to-red-600", icon: "card", label: "Credit" },
};

export function presentWallet(wallet) {
  const presentation = walletTypePresentation[wallet.type] || walletTypePresentation.cash;
  return { ...wallet, balance: Number(wallet.current_balance ?? wallet.balance ?? 0), ...presentation };
}

export function transactionDisplay(transaction, activeWalletId) {
  if (transaction.type === "transfer") {
    const incoming = transaction.to_wallet_id === activeWalletId;
    return {
      ...transaction,
      name: transaction.description || (incoming ? `Transfer from ${transaction.from_wallet?.name || "wallet"}` : `Transfer to ${transaction.to_wallet?.name || "wallet"}`),
      category: "Transfer",
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
