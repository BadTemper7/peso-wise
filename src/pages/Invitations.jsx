import React, { useEffect, useState } from "react";
import { FiArrowLeft, FiCheck, FiClock, FiMail, FiX } from "react-icons/fi";
import { Link, useNavigate } from "react-router";
import Logo from "../assets/logo.webp";
import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";
import { PrimaryButton, SecondaryButton } from "../components/common/FormControls";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { invitationService } from "../services/invitationService";
import { formatDate } from "../utils/date";
import { getFriendlyError } from "../utils/errors";

export default function Invitations() {
  const toast = useToast(); const navigate = useNavigate(); const { refreshWorkspaces } = useWorkspace();
  const [invitations, setInvitations] = useState([]); const [loading, setLoading] = useState(true); const [actionId, setActionId] = useState(null);
  const load = async () => { setLoading(true); try { setInvitations(await invitationService.listMine()); } catch (error) { toast.error(getFriendlyError(error)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const respond = async (invitation, accept) => { setActionId(invitation.id); try { if (accept) { await invitationService.accept(invitation.id); await refreshWorkspaces({ keepSelection:false }); toast.success(`You joined ${invitation.workspace?.name}.`); navigate("/dashboard", { replace:true }); } else { await invitationService.decline(invitation.id); toast.info("Invitation declined."); load(); } } catch (error) { toast.error(getFriendlyError(error)); } finally { setActionId(null); } };
  if (loading) return <LoadingScreen label="Checking invitations…" />;
  return <div className="min-h-screen bg-[#f5f7fb] p-4 dark:bg-[#07111f] sm:p-8"><div className="mx-auto max-w-3xl"><div className="flex items-center justify-between"><Link to="/dashboard" className="flex items-center gap-3"><img src={Logo} className="h-10 w-10 rounded-xl" alt="PesoWise" /><span className="font-bold text-slate-950 dark:text-white">PesoWise</span></Link><Link to="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-600"><FiArrowLeft /> Back to dashboard</Link></div><div className="mt-10"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Shared budgets</p><h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">Workspace invitations</h1><p className="mt-2 text-sm leading-6 text-slate-500">Accept an invitation to see the same wallets, transactions, budgets, charts, and reports as the other workspace members.</p></div>{invitations.length === 0 ? <div className="mt-8"><EmptyState icon={FiMail} title="No pending invitations" description="New workspace invitations sent to your account email will appear here." /></div> : <div className="mt-8 space-y-4">{invitations.map((invitation) => <article key={invitation.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2b]"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300"><FiMail className="h-6 w-6" /></span><div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-slate-900 dark:text-white">{invitation.workspace?.name}</h2><p className="mt-1 text-sm text-slate-500">Invited by {invitation.inviter?.full_name || invitation.inviter?.email || "a workspace admin"} as <strong className="capitalize">{invitation.role}</strong></p><p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><FiClock /> Expires {formatDate(invitation.expires_at.slice(0,10))}</p></div><div className="flex gap-2 sm:flex-col"><PrimaryButton loading={actionId===invitation.id} onClick={() => respond(invitation,true)} className="flex-1"><FiCheck /> Accept</PrimaryButton><SecondaryButton disabled={actionId===invitation.id} onClick={() => respond(invitation,false)} className="flex-1"><FiX /> Decline</SecondaryButton></div></div></article>)}</div>}</div></div>;
}
