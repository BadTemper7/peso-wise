export const pad = (n) => String(n).padStart(2, "0");

export function getMonthValue(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function getMonthBounds(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { start, end, year, month };
}

export function monthLabel(value, short = false) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", { month: short ? "short" : "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

export function formatDate(value, options = {}) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", ...options }).format(new Date(`${value}T00:00:00`));
}

export function isFutureMonth(value) {
  return value > getMonthValue();
}

export function relativeTime(value) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(date);
}
