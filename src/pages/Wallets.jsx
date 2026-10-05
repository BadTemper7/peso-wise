import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiArchive, FiCreditCard, FiEdit2, FiPlus, FiRotateCcw, FiSmartphone, FiDollarSign } from "react-icons/fi";
import { useSearchParams } from "react-router";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";
import PageHeader from "../components/common/PageHeader";
import { PrimaryButton, SecondaryButton } from "../components/common/FormControls";
import WalletFormModal from "../components/wallets/WalletFormModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useWorkspaceRealtime } from "../hooks/useWorkspaceRealtime";
import { formatCurrency } from "../lib/format";
import { walletService } from "../services/walletService";
import { getFriendlyError } from "../utils/errors";
import { walletTypePresentation } from "../utils/presentation";

const typeIcons = { cash: FiDollarSign, ewallet: FiSmartphone, debit: FiCreditCard, credit: FiCreditCard };
const realtimeTables = ["wallets"];

export default function Wallets() {
  const { user } = useAuth(); const { activeWorkspace, role } = useWorkspace(); const toast = useToast(); const [params, setParams] = useSearchParams();
  const [wallets, setWallets] = useState([]); const [loading, setLoading] = useState(true); const [formOpen, setFormOpen] = useState(false); const [editing, setEditing] = useState(null); const [archiving, setArchiving] = useState(null); const [actionLoading, setActionLoading] = useState(false);
  const canManage = ["owner","admin"].includes(role) || (role === "member" && Boolean(activeWorkspace.settings?.member_can_manage_wallets));
  const load = useCallback(async ({ silent = false } = {}) => { if (!silent) setLoading(true); try { setWallets(await walletService.list(activeWorkspace.id, { includeArchived: true })); } catch (error) { toast.error(getFriendlyError(error)); } finally { setLoading(false); } }, [activeWorkspace.id, toast]);
  useEffect(() => { load(); }, [load]); useWorkspaceRealtime(activeWorkspace.id, realtimeTables, useCallback(() => load({ silent: true }), [load]));
  useEffect(() => { if (params.get("create") === "1" && canManage) { setEditing(null); setFormOpen(true); const next = new URLSearchParams(params); next.delete("create"); setParams(next, { replace: true }); } }, [params, canManage, setParams]);
  const active = useMemo(() => wallets.filter((wallet) => !wallet.is_archived), [wallets]); const archived = useMemo(() => wallets.filter((wallet) => wallet.is_archived), [wallets]);
  const toggleArchive = async () => { if (!archiving) return; setActionLoading(true); try { await walletService.archive(archiving.id, !archiving.is_archived); toast.success(archiving.is_archived ? "Wallet restored." : "Wallet archived."); setArchiving(null); load({ silent: true }); } catch (error) { toast.error(getFriendlyError(error)); } finally { setActionLoading(false); } };
  if (loading) return <LoadingScreen compact />;
  return <div><PageHeader eyebrow={activeWorkspace.name} title="Wallets" description="Create Cash, E-wallet, Debit, and Credit accounts inside this workspace." actions={canManage && <PrimaryButton onClick={() => { setEditing(null); setFormOpen(true); }}><FiPlus /> Add wallet</PrimaryButton>} />
    {active.length === 0 ? <EmptyState title="Create your first wallet" description="Add Cash, GCash, Maya, a debit account, or a credit card to start managing money." actionLabel={canManage ? "Create wallet" : undefined} onAction={() => setFormOpen(true)} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{active.map((wallet) => { const presentation = walletTypePresentation[wallet.type]; const Icon = typeIcons[wallet.type] || FiCreditCard; return <article key={wallet.id} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${presentation.color} p-5 text-white shadow-lg`}><div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" /><div className="relative"><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><Icon className="h-5 w-5" /></span><span className="rounded-full bg-black/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/75">{presentation.label}</span></div><p className="mt-6 text-xs font-medium text-white/65">{wallet.name}</p><p className={`mt-1 text-3xl font-bold tracking-tight tabular-nums ${Number(wallet.current_balance) < 0 ? "text-rose-100" : ""}`}>{formatCurrency(wallet.current_balance, wallet.currency)}</p><p className="mt-1 text-[10px] text-white/55">Initial balance {formatCurrency(wallet.initial_balance, wallet.currency)}</p>{canManage && <div className="mt-5 flex gap-2"><button type="button" onClick={() => { setEditing(wallet); setFormOpen(true); }} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-white/15 text-xs font-bold backdrop-blur transition hover:bg-white/25"><FiEdit2 /> Edit</button><button type="button" onClick={() => setArchiving(wallet)} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-black/10 text-xs font-bold transition hover:bg-black/20"><FiArchive /> Archive</button></div>}</div></article>; })}</div>}
    {archived.length > 0 && <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0d1a2b]"><div className="mb-4"><h2 className="text-sm font-bold text-slate-900 dark:text-white">Archived wallets</h2><p className="mt-1 text-xs text-slate-400">Archived wallets remain available in historical transactions and reports.</p></div><div className="space-y-2">{archived.map((wallet) => <div key={wallet.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-white/[0.035]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-500 dark:bg-white/[0.08]"><FiArchive /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{wallet.name}</p><p className="text-[10px] capitalize text-slate-400">{wallet.type} · {formatCurrency(wallet.current_balance, wallet.currency)}</p></div>{canManage && <SecondaryButton onClick={() => setArchiving(wallet)} className="h-9"><FiRotateCcw /> Restore</SecondaryButton>}</div>)}</div></section>}
    <WalletFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} workspaceId={activeWorkspace.id} userId={user.id} currency={activeWorkspace.currency} wallet={editing} onSaved={() => load({ silent: true })} />
    <ConfirmDialog open={Boolean(archiving)} onClose={() => setArchiving(null)} onConfirm={toggleArchive} title={archiving?.is_archived ? "Restore wallet?" : "Archive wallet?"} description={archiving?.is_archived ? "The wallet will be available for new transactions again." : "Existing transactions remain visible. The wallet cannot be used for new transactions while archived."} confirmLabel={archiving?.is_archived ? "Restore" : "Archive"} loading={actionLoading} />
  </div>;
}
