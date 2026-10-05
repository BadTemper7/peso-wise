export const MEMBER_ROLES = ["owner", "admin", "member", "viewer"];
export const INVITABLE_ROLES = ["admin", "member", "viewer"];
export const WALLET_TYPES = [
  { value: "cash", label: "Cash", description: "Physical cash or cash on hand" },
  { value: "ewallet", label: "E-wallet", description: "GCash, Maya, GrabPay and similar" },
  { value: "debit", label: "Debit", description: "Bank savings or debit account" },
  { value: "credit", label: "Credit", description: "Credit card or credit line" },
];
export const TRANSACTION_TYPES = ["income", "expense", "transfer"];
export const DEFAULT_CURRENCY = "PHP";
export const ROLE_LABELS = { owner: "Owner", admin: "Admin", member: "Member", viewer: "Viewer" };
export const ROLE_RANK = { viewer: 0, member: 1, admin: 2, owner: 3 };
