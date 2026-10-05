export const wallets = [
  {
    id: "cash",
    name: "Cash",
    type: "cash",
    balance: 8420.5,
    color: "from-emerald-400 to-teal-500",
    icon: "cash",
  },
  {
    id: "gcash",
    name: "GCash",
    type: "ewallet",
    balance: 12380.25,
    color: "from-sky-400 to-blue-600",
    icon: "mobile",
  },
  {
    id: "credit",
    name: "Credit Card",
    type: "credit",
    balance: -15420.75,
    color: "from-rose-400 to-red-600",
    icon: "card",
  },
  {
    id: "bpi",
    name: "BPI Savings",
    type: "bank",
    balance: 96240.0,
    color: "from-amber-300 to-orange-500",
    icon: "bank",
  },
];

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_SHORT_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const getMonthValue = (year, monthIndex) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

export const getMonthLabel = (value, short = false) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) return "";
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return "";
  const names = short ? MONTH_SHORT_NAMES : MONTH_NAMES;
  return `${names[monthIndex]} ${year}`;
};

export const getCurrentMonthValue = () => {
  const now = new Date();
  return getMonthValue(now.getFullYear(), now.getMonth());
};

export const isFutureMonthValue = (value) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) return true;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && monthIndex > now.getMonth());
};

export const dashboardMonths = MONTH_NAMES.map((name, monthIndex) => {
  const now = new Date();
  const year = now.getFullYear();
  return {
    value: getMonthValue(year, monthIndex),
    label: `${name} ${year}`,
    shortLabel: `${MONTH_SHORT_NAMES[monthIndex]} ${year}`,
    disabled: monthIndex > now.getMonth(),
  };
});

const applyBalances = (balances) =>
  wallets.map((wallet) => ({
    ...wallet,
    balance: balances[wallet.id] ?? wallet.balance,
  }));

export const monthlyDashboardData = {
  "2026-10": {
    label: "October 2026",
    wallets: applyBalances({
      cash: 8420.5,
      gcash: 12380.25,
      credit: -15420.75,
      bpi: 96240,
    }),
    transactionsByWallet: {
      cash: [
        { id: "oct-c1", name: "Jollibee", category: "Food", date: "Oct 4", amount: -320 },
        { id: "oct-c2", name: "Tricycle", category: "Transport", date: "Oct 4", amount: -45 },
        { id: "oct-c3", name: "Transfer from GCash", category: "Transfer", date: "Oct 3", amount: 2000 },
        { id: "oct-c4", name: "7-Eleven", category: "Groceries", date: "Oct 3", amount: -180 },
        { id: "oct-c5", name: "Coffee Project", category: "Food", date: "Oct 2", amount: -165 },
        { id: "oct-c6", name: "Laundry Shop", category: "Bills", date: "Oct 2", amount: -280 },
        { id: "oct-c7", name: "Cash allowance", category: "Income", date: "Oct 1", amount: 3500 },
        { id: "oct-c8", name: "Pharmacy", category: "Payment", date: "Oct 1", amount: -640 },
      ],
      gcash: [
        { id: "oct-g1", name: "Salary", category: "Income", date: "Oct 1", amount: 45000 },
        { id: "oct-g2", name: "Meralco", category: "Bills", date: "Oct 3", amount: -3150 },
        { id: "oct-g3", name: "Transfer to Cash", category: "Transfer", date: "Oct 3", amount: -2000 },
        { id: "oct-g4", name: "Grab", category: "Transport", date: "Oct 4", amount: -245 },
        { id: "oct-g5", name: "Globe", category: "Bills", date: "Oct 2", amount: -999 },
        { id: "oct-g6", name: "Shopee", category: "Payment", date: "Oct 2", amount: -1340 },
      ],
      credit: [
        { id: "oct-cc1", name: "SM Grocery", category: "Groceries", date: "Oct 2", amount: -4280 },
        { id: "oct-cc2", name: "Netflix", category: "Subscription", date: "Oct 1", amount: -549 },
        { id: "oct-cc3", name: "Card payment", category: "Payment", date: "Oct 1", amount: 5000 },
        { id: "oct-cc4", name: "Fuel", category: "Transport", date: "Oct 4", amount: -1800 },
        { id: "oct-cc5", name: "Restaurant", category: "Food", date: "Oct 3", amount: -1280 },
      ],
      bpi: [
        { id: "oct-b1", name: "Emergency Fund", category: "Savings", date: "Oct 1", amount: 10000 },
        { id: "oct-b2", name: "Interest", category: "Income", date: "Oct 1", amount: 128.4 },
        { id: "oct-b3", name: "Home rent", category: "Bills", date: "Oct 2", amount: -12500 },
        { id: "oct-b4", name: "Insurance", category: "Bills", date: "Oct 3", amount: -3200 },
      ],
    },
    spendingTrend: [
      { period: "Week 1", amount: 4380 },
      { period: "Week 2", amount: 6120 },
      { period: "Week 3", amount: 5290 },
      { period: "Week 4", amount: 7440 },
      { period: "Week 5", amount: 2840 },
    ],
  },
  "2026-09": {
    label: "September 2026",
    wallets: applyBalances({
      cash: 6150.75,
      gcash: 9890.5,
      credit: -12240.25,
      bpi: 91860,
    }),
    transactionsByWallet: {
      cash: [
        { id: "sep-c1", name: "Jollibee", category: "Food", date: "Sep 28", amount: -410 },
        { id: "sep-c2", name: "Jeepney", category: "Transport", date: "Sep 28", amount: -36 },
        { id: "sep-c3", name: "Cash allowance", category: "Income", date: "Sep 25", amount: 3000 },
        { id: "sep-c4", name: "Puregold", category: "Groceries", date: "Sep 23", amount: -1120 },
        { id: "sep-c5", name: "Coffee", category: "Food", date: "Sep 20", amount: -145 },
        { id: "sep-c6", name: "Water refill", category: "Bills", date: "Sep 18", amount: -180 },
        { id: "sep-c7", name: "Transfer from GCash", category: "Transfer", date: "Sep 14", amount: 1500 },
      ],
      gcash: [
        { id: "sep-g1", name: "Salary", category: "Income", date: "Sep 1", amount: 45000 },
        { id: "sep-g2", name: "Meralco", category: "Bills", date: "Sep 7", amount: -2980 },
        { id: "sep-g3", name: "Grab", category: "Transport", date: "Sep 12", amount: -310 },
        { id: "sep-g4", name: "Internet", category: "Bills", date: "Sep 15", amount: -1699 },
        { id: "sep-g5", name: "Transfer to Cash", category: "Transfer", date: "Sep 14", amount: -1500 },
      ],
      credit: [
        { id: "sep-cc1", name: "SM Grocery", category: "Groceries", date: "Sep 10", amount: -3680 },
        { id: "sep-cc2", name: "Netflix", category: "Subscription", date: "Sep 1", amount: -549 },
        { id: "sep-cc3", name: "Card payment", category: "Payment", date: "Sep 5", amount: 6000 },
        { id: "sep-cc4", name: "Restaurant", category: "Food", date: "Sep 22", amount: -1780 },
      ],
      bpi: [
        { id: "sep-b1", name: "Emergency Fund", category: "Savings", date: "Sep 2", amount: 8000 },
        { id: "sep-b2", name: "Interest", category: "Income", date: "Sep 30", amount: 118.2 },
        { id: "sep-b3", name: "Home rent", category: "Bills", date: "Sep 3", amount: -12500 },
      ],
    },
    spendingTrend: [
      { period: "Week 1", amount: 5020 },
      { period: "Week 2", amount: 4360 },
      { period: "Week 3", amount: 6880 },
      { period: "Week 4", amount: 5740 },
      { period: "Week 5", amount: 1890 },
    ],
  },
  "2026-08": {
    label: "August 2026",
    wallets: applyBalances({
      cash: 7925.25,
      gcash: 14320.4,
      credit: -9840.5,
      bpi: 87640,
    }),
    transactionsByWallet: {
      cash: [
        { id: "aug-c1", name: "Mang Inasal", category: "Food", date: "Aug 29", amount: -285 },
        { id: "aug-c2", name: "Taxi", category: "Transport", date: "Aug 27", amount: -220 },
        { id: "aug-c3", name: "Cash allowance", category: "Income", date: "Aug 25", amount: 3200 },
        { id: "aug-c4", name: "Robinsons", category: "Groceries", date: "Aug 21", amount: -980 },
        { id: "aug-c5", name: "Bakery", category: "Food", date: "Aug 18", amount: -190 },
        { id: "aug-c6", name: "Transfer from GCash", category: "Transfer", date: "Aug 12", amount: 1800 },
      ],
      gcash: [
        { id: "aug-g1", name: "Salary", category: "Income", date: "Aug 1", amount: 45000 },
        { id: "aug-g2", name: "Meralco", category: "Bills", date: "Aug 6", amount: -2860 },
        { id: "aug-g3", name: "Grab", category: "Transport", date: "Aug 13", amount: -275 },
        { id: "aug-g4", name: "Mobile load", category: "Bills", date: "Aug 15", amount: -599 },
        { id: "aug-g5", name: "Transfer to Cash", category: "Transfer", date: "Aug 12", amount: -1800 },
      ],
      credit: [
        { id: "aug-cc1", name: "S&R", category: "Groceries", date: "Aug 9", amount: -4920 },
        { id: "aug-cc2", name: "Netflix", category: "Subscription", date: "Aug 1", amount: -549 },
        { id: "aug-cc3", name: "Card payment", category: "Payment", date: "Aug 5", amount: 7000 },
      ],
      bpi: [
        { id: "aug-b1", name: "Emergency Fund", category: "Savings", date: "Aug 2", amount: 7500 },
        { id: "aug-b2", name: "Interest", category: "Income", date: "Aug 31", amount: 112.75 },
        { id: "aug-b3", name: "Home rent", category: "Bills", date: "Aug 3", amount: -12500 },
      ],
    },
    spendingTrend: [
      { period: "Week 1", amount: 3980 },
      { period: "Week 2", amount: 7210 },
      { period: "Week 3", amount: 4860 },
      { period: "Week 4", amount: 6340 },
      { period: "Week 5", amount: 2450 },
    ],
  },
};

// Compatibility exports used by other screens/components.
export const transactionsByWallet = monthlyDashboardData["2026-10"].transactionsByWallet;
export const weekly = monthlyDashboardData["2026-10"].spendingTrend.map((item) => ({
  day: item.period,
  amount: item.amount,
}));

export const stats = [
  { label: "Income", value: "₱56,240", change: "8.6%", trend: "up", tone: "income" },
  { label: "Expenses", value: "₱21,340", change: "3.2%", trend: "down", tone: "expense" },
  { label: "Saved", value: "₱34,900", change: "14.1%", trend: "up", tone: "saving" },
];

export const budgets = [
  { name: "Food & Dining", spent: 6200, limit: 8000 },
  { name: "Transport", spent: 3400, limit: 3500 },
  { name: "Bills & Utilities", spent: 5800, limit: 5500 },
  { name: "Shopping", spent: 2100, limit: 6000 },
];

export const spendingCategories = [
  { name: "Food & Dining", amount: 6200, share: 29, color: "#14b8a6" },
  { name: "Bills & Utilities", amount: 5800, share: 27, color: "#2563eb" },
  { name: "Transport", amount: 3400, share: 16, color: "#f5b942" },
  { name: "Shopping", amount: 3100, share: 15, color: "#8b5cf6" },
  { name: "Others", amount: 2840, share: 13, color: "#cbd5e1" },
];
