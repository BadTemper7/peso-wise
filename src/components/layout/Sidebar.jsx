import React from "react";
import { NavLink, Link, useNavigate } from "react-router";
import { FiBarChart2, FiCreditCard, FiFileText, FiHome, FiLogOut, FiPieChart, FiSettings, FiUser, FiUsers, FiX } from "react-icons/fi";
import Logo from "../../assets/logo.webp";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import WorkspaceSwitcher from "../workspace/WorkspaceSwitcher";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: FiHome },
  { to: "/transactions", label: "Transactions", icon: FiFileText },
  { to: "/wallets", label: "Wallets", icon: FiCreditCard },
  { to: "/budgets", label: "Budgets", icon: FiPieChart },
  { to: "/reports", label: "Reports", icon: FiBarChart2 },
  { to: "/members", label: "Members", icon: FiUsers },
];

function NavItem({ to, label, icon: Icon, onClick }) {
  return <NavLink to={to} onClick={onClick} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-[#e7fbf5] text-[#087f6b] shadow-sm ring-1 ring-[#c8f3e6] dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"}`}><Icon className="h-[18px] w-[18px] shrink-0" /><span>{label}</span></NavLink>;
}

export default function Sidebar({ open, onClose }) {
  const { profile, user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const name = profile?.full_name || user?.email?.split("@")[0] || "PesoWise User";
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const signOut = async () => { try { await logout(); navigate("/login", { replace: true }); } catch { toast.error("Could not sign out. Please try again."); } };

  return <aside className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-slate-200 bg-white px-3 transition-transform duration-300 dark:border-slate-800 dark:bg-[#091525] lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
    <div className="flex h-20 items-center justify-between px-2"><Link to="/dashboard" onClick={onClose} className="flex min-w-0 items-center gap-3"><img src={Logo} alt="PesoWise" className="h-10 w-10 rounded-xl object-contain shadow-sm" /><div className="min-w-0 leading-tight"><p className="truncate text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">PesoWise</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Money Manager</p></div></Link><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 lg:hidden"><FiX className="h-5 w-5" /></button></div>
    <div className="px-1 pb-3"><WorkspaceSwitcher onNavigate={onClose} /></div>
    <div className="scrollbar-thin flex-1 overflow-y-auto px-1 pb-5"><p className="mb-2 px-3 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">Workspace</p><nav className="space-y-1">{links.map((link) => <NavItem key={link.to} {...link} onClick={onClose} />)}</nav></div>
    <div className="space-y-2 border-t border-slate-200 py-4 dark:border-slate-800"><NavItem to="/settings" label="Settings" icon={FiSettings} onClick={onClose} /><div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.04]"><div className="flex items-center gap-3"><Link to="/profile" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0e3e85] to-teal-400 text-xs font-bold text-white">{initials}</Link><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{name}</p><p className="truncate text-[11px] text-slate-400">{user?.email}</p></div><button type="button" onClick={signOut} aria-label="Log out" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-400/10"><FiLogOut className="h-4 w-4" /></button></div></div></div>
  </aside>;
}
