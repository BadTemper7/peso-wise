export function getFriendlyError(error, fallback = "Something went wrong. Please try again.") {
  const message = error?.message || String(error || "");
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Incorrect email or password.";
  if (lower.includes("email not confirmed")) return "Please verify your email before signing in.";
  if (lower.includes("user already registered")) return "An account with this email already exists.";
  if (lower.includes("duplicate") || lower.includes("already a member")) return "This person is already part of the workspace.";
  if (lower.includes("permission") || lower.includes("row-level security") || lower.includes("not authorized")) return "You do not have permission to perform this action.";
  if (lower.includes("network") || lower.includes("fetch")) return "We could not connect to the server. Check your internet connection.";
  if (lower.includes("expired")) return "This invitation or link has expired.";
  if (lower.includes("wallet has transactions")) return "This wallet has transactions and cannot be removed. Archive it instead.";
  if (lower.includes("wallet has monthly records")) return "This wallet has monthly history and cannot be removed. Archive it instead.";
  if (lower.includes("wallet has savings borrowing history")) return "This wallet has Savings borrowing history and cannot be removed. Archive it instead.";
  if (lower.includes("savings wallet cannot be removed")) return "The workspace Savings wallet cannot be removed.";
  if (lower.includes("wallet start date cannot be after existing wallet activity")) return "The wallet start date cannot be later than its earliest transaction or completed monthly record.";
  return message || fallback;
}
