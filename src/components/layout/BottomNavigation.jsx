import React, { useEffect, useMemo, useState } from "react";
import {
  FiBarChart2,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiLoader,
  FiMoreHorizontal,
  FiPieChart,
  FiPlus,
  FiSettings,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { Link, NavLink, useLocation } from "react-router";
import Modal from "../common/Modal";
import TransactionFormModal from "../transactions/TransactionFormModal";
import InstallAppAction from "../pwa/InstallAppAction";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { categoryService } from "../../services/categoryService";
import { walletService } from "../../services/walletService";
import { getFriendlyError } from "../../utils/errors";

const primaryLinks = [
  { to: "/dashboard", label: "Home", icon: FiHome },
  { to: "/transactions", label: "Transactions", icon: FiFileText },
  { to: "/reports", label: "Reports", icon: FiBarChart2 },
];

const moreLinks = [
  {
    to: "/wallets",
    label: "Wallets",
    description: "Manage cash, bank, and savings wallets",
    icon: FiCreditCard,
  },
  {
    to: "/budgets",
    label: "Budgets",
    description: "Set and review spending limits",
    icon: FiPieChart,
  },
  {
    to: "/members",
    label: "Members",
    description: "Manage people in this workspace",
    icon: FiUsers,
  },
  {
    to: "/settings",
    label: "Workspace & categories",
    description: "Workspace details, permissions, and categories",
    icon: FiSettings,
  },
  {
    to: "/profile",
    label: "Account",
    description: "Profile and personal account details",
    icon: FiUser,
  },
];

const morePaths = new Set(moreLinks.map((item) => item.to));
const quickTransactionTypes = ["income", "expense"];

const navItemClass = (isActive) =>
  `flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold leading-none transition ${
    isActive
      ? "text-teal-600 dark:text-teal-300"
      : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
  }`;

const navIconClass = (isActive) =>
  `flex h-7 w-9 items-center justify-center rounded-lg transition ${
    isActive ? "bg-teal-50 dark:bg-teal-400/10" : "bg-transparent"
  }`;

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink to={to} className={({ isActive }) => navItemClass(isActive)}>
      {({ isActive }) => (
        <>
          <span className={navIconClass(isActive)}>
            <Icon className="h-[19px] w-[19px]" />
          </span>
          <span className="max-w-full truncate text-[10px] leading-none">
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

function NavButton({ label, icon: Icon, isActive, onClick, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={navItemClass(isActive)}
      {...props}
    >
      <span className={navIconClass(isActive)}>
        <Icon className="h-[19px] w-[19px]" />
      </span>
      <span className="max-w-full truncate text-[10px] leading-none">
        {label}
      </span>
    </button>
  );
}

export default function BottomNavigation() {
  const location = useLocation();
  const { user } = useAuth();
  const { activeWorkspace, role } = useWorkspace();
  const toast = useToast();
  const [moreOpen, setMoreOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);

  const moreActive = moreOpen || morePaths.has(location.pathname);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setAddOpen(false);
    setWallets([]);
    setCategories([]);
  }, [activeWorkspace?.id]);

  const canCreate = role !== "viewer";

  const openAddTransaction = async () => {
    if (!canCreate) {
      toast.error("Viewers can view transactions but cannot add new ones.");
      return;
    }
    if (!activeWorkspace?.id || !user?.id || addLoading) return;

    setAddLoading(true);
    try {
      const [nextWallets, nextCategories] = await Promise.all([
        walletService.list(activeWorkspace.id),
        categoryService.list(activeWorkspace.id),
      ]);
      setWallets(nextWallets);
      setCategories(nextCategories);
      setAddOpen(true);
    } catch (error) {
      toast.error(
        getFriendlyError(error, "Could not prepare the transaction form."),
      );
    } finally {
      setAddLoading(false);
    }
  };

  const moreItems = useMemo(
    () =>
      moreLinks.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:border-teal-200 hover:bg-teal-50/60 dark:border-slate-700 dark:bg-white/[0.025] dark:hover:border-teal-400/20 dark:hover:bg-teal-400/[0.05]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
              <Icon className="h-[19px] w-[19px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-900 dark:text-white">
                {item.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">
                {item.description}
              </span>
            </span>
          </Link>
        );
      }),
    [],
  );

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-[25] border-t border-slate-200/90 bg-white/95 px-2 pt-1.5 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#091525]/95 lg:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.35rem)" }}
        aria-label="Main navigation"
      >
        <div className="mx-auto grid h-[64px] max-w-xl grid-cols-5 items-end">
          <NavItem {...primaryLinks[0]} />
          <NavItem {...primaryLinks[1]} />

          <div className="relative flex h-[64px] min-w-0 flex-col items-center justify-end pb-1.5">
            <button
              type="button"
              onClick={openAddTransaction}
              aria-label="Add transaction"
              aria-busy={addLoading || undefined}
              className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-5 items-center justify-center rounded-2xl border-[4px] border-white bg-teal-500 text-white shadow-[0_10px_28px_rgba(20,184,166,0.35)] transition hover:bg-teal-400 active:scale-95 active:bg-teal-600 dark:border-[#091525] dark:bg-teal-400 dark:text-[#062019] dark:hover:bg-teal-300"
            >
              {addLoading ? (
                <FiLoader className="h-6 w-6 animate-spin" />
              ) : (
                <FiPlus className="h-7 w-7" />
              )}
            </button>
            <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-300">
              Add
            </span>
          </div>

          <NavItem {...primaryLinks[2]} />

          <NavButton
            label="More"
            icon={FiMoreHorizontal}
            isActive={moreActive}
            onClick={() => setMoreOpen(true)}
            aria-label="More navigation"
            aria-expanded={moreOpen}
          />
        </div>
      </nav>

      <TransactionFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        workspaceId={activeWorkspace?.id}
        userId={user?.id}
        wallets={wallets}
        categories={categories}
        allowedTypes={quickTransactionTypes}
        onSaved={() => {
          window.dispatchEvent(new CustomEvent("pesowise:transaction-saved"));
        }}
      />

      <Modal
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="More"
        description="Wallets, budgets, members, workspace settings, and your account."
        maxWidth="max-w-md"
      >
        <div className="space-y-2.5">
          {moreItems}
          <InstallAppAction hideWhenInstalled />
        </div>
      </Modal>
    </>
  );
}
