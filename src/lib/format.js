const currencySymbols = { PHP: "₱", USD: "$", EUR: "€", JPY: "¥" };

export function formatCurrency(value, currency = "PHP", options = {}) {
  const number = Number(value || 0);
  const decimals = options.decimals ?? 2;
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  } catch {
    return `${currencySymbols[currency] || `${currency} `}${number.toLocaleString("en-PH", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
}

export const formatPeso = (value, options = {}) => formatCurrency(value, "PHP", options);
export const formatSigned = (value, currency = "PHP") => `${Number(value) < 0 ? "−" : "+"}${formatCurrency(Math.abs(Number(value || 0)), currency)}`;
