import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiCheck, FiClock, FiMail, FiPlusCircle, FiRefreshCw, FiUsers, FiX } from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router";
import Logo from "../assets/logo.webp";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "../components/common/FormControls";
import LoadingScreen from "../components/common/LoadingScreen";
import { SkeletonBlock } from "../components/common/LoadingStates";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { invitationService } from "../services/invitationService";
import { workspaceService } from "../services/workspaceService";
import { formatDate } from "../utils/date";
import { getFriendlyError } from "../utils/errors";

const validMode = (value) => value === "create" || value === "join";
const emailIntentKey = (email) => `pesowise-onboarding-intent:${String(email || "").trim().toLowerCase()}`;

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const {
    workspaces,
    refreshWorkspaces,
    switchWorkspace,
    loading: workspaceLoading,
    initialized: workspaceInitialized,
  } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", description: "", currency: "PHP" });
  const [creating, setCreating] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationAction, setInvitationAction] = useState(null);

  const explicitlyCreatingAnother = params.get("new") === "1";
  const creatingAnother = explicitlyCreatingAnother || workspaces.length > 0;

  const preferredMode = useMemo(() => {
    if (explicitlyCreatingAnother) return "create";
    const routeMode = params.get("mode");
    if (validMode(routeMode)) return routeMode;
    const metadataMode = user?.user_metadata?.onboarding_intent;
    if (validMode(metadataMode)) return metadataMode;
    const savedMode = window.localStorage.getItem(emailIntentKey(user?.email));
    return validMode(savedMode) ? savedMode : "create";
  }, [explicitlyCreatingAnother, params, user?.email, user?.user_metadata?.onboarding_intent]);

  const [mode, setModeState] = useState(preferredMode);

  useEffect(() => {
    if (!explicitlyCreatingAnother && validMode(preferredMode)) setModeState(preferredMode);
  }, [preferredMode, explicitlyCreatingAnother]);

  useEffect(() => {
    if (workspaceInitialized && !workspaceLoading && workspaces.length > 0 && !explicitlyCreatingAnother) {
      navigate("/dashboard", { replace: true });
    }
  }, [workspaceInitialized, workspaceLoading, workspaces.length, explicitlyCreatingAnother, navigate]);

  const setMode = (nextMode) => {
    if (!validMode(nextMode) || explicitlyCreatingAnother) return;
    setModeState(nextMode);
    if (user?.email) window.localStorage.setItem(emailIntentKey(user.email), nextMode);
    const nextParams = new URLSearchParams(params);
    nextParams.set("mode", nextMode);
    setParams(nextParams, { replace: true });
  };

  const loadInvitations = useCallback(async ({ silent = false } = {}) => {
    if (!user || mode !== "join" || explicitlyCreatingAnother) return [];
    if (!silent) setInvitationsLoading(true);
    try {
      const next = await invitationService.listMine();
      setInvitations(next);
      return next;
    } catch (error) {
      toast.error(getFriendlyError(error));
      return [];
    } finally {
      if (!silent) setInvitationsLoading(false);
    }
  }, [user, mode, explicitlyCreatingAnother, toast]);

  useEffect(() => {
    if (workspaceInitialized && !workspaceLoading && mode === "join" && !explicitlyCreatingAnother && workspaces.length === 0) {
      loadInvitations().catch(() => {});
    }
  }, [workspaceInitialized, workspaceLoading, mode, explicitlyCreatingAnother, workspaces.length, loadInvitations]);

  const submitCreate = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return toast.error("Enter a workspace name.");
    setCreating(true);
    try {
      const created = await workspaceService.create(form);
      await Promise.all([refreshWorkspaces({ keepSelection: false }), refreshProfile()]);
      switchWorkspace(created.id);
      if (user?.email) window.localStorage.removeItem(emailIntentKey(user.email));
      toast.success("Workspace created. Add your first wallet to begin.");
      navigate("/wallets?create=1", { replace: true });
    } catch (error) {
      toast.error(getFriendlyError(error));
    } finally {
      setCreating(false);
    }
  };

  const respondToInvitation = async (invitation, accept) => {
    setInvitationAction({ id: invitation.id, type: accept ? "accept" : "decline" });
    try {
      if (accept) {
        const membership = await invitationService.accept(invitation.id);
        await Promise.all([refreshWorkspaces({ keepSelection: false }), refreshProfile()]);
        const joinedWorkspaceId = membership?.workspace_id || invitation.workspace_id || invitation.workspace?.id;
        if (joinedWorkspaceId) switchWorkspace(joinedWorkspaceId);
        if (user?.email) window.localStorage.removeItem(emailIntentKey(user.email));
        toast.success(`You joined ${invitation.workspace?.name || "the shared budget"}.`);
        navigate("/dashboard", { replace: true });
      } else {
        await invitationService.decline(invitation.id);
        setInvitations((current) => current.filter((item) => item.id !== invitation.id));
        toast.info("Invitation declined. Choose another invitation or create a budget to continue.");
      }
    } catch (error) {
      toast.error(getFriendlyError(error));
    } finally {
      setInvitationAction(null);
    }
  };

  if (workspaceLoading || !workspaceInitialized) return <LoadingScreen label="Checking your workspace…" />;
  if (workspaces.length > 0 && !explicitlyCreatingAnother) return <LoadingScreen label="Returning to your dashboard…" />;

  const joining = mode === "join" && !explicitlyCreatingAnother;

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-4 dark:bg-[#07111f] sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={Logo} className="h-11 w-11 rounded-xl" alt="PesoWise" />
            <div>
              <p className="font-bold text-slate-950 dark:text-white">PesoWise</p>
              <p className="text-[10px] uppercase tracking-widest text-teal-500">Money Manager</p>
            </div>
          </div>
          {creatingAnother && <SecondaryButton onClick={() => navigate("/dashboard")}>Cancel</SecondaryButton>}
        </div>

        <div className="mt-10 grid overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-[#0d1a2b] lg:grid-cols-[1fr_1.05fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#082f62] via-[#0c5784] to-[#0e8c82] p-8 text-white sm:p-12">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />
            <div className="relative">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                {joining ? <FiUsers className="h-5 w-5" /> : <FiPlusCircle className="h-5 w-5" />}
              </span>
              <h1 className="mt-7 text-3xl font-bold tracking-tight sm:text-4xl">
                {creatingAnother ? "Create another workspace" : joining ? "Join a shared budget" : "Create your first budget"}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
                {joining
                  ? "Use your own secure account to join a budget invitation sent to your email. You will share only the workspace you accept."
                  : "A workspace keeps wallets, transactions, budgets, reports, and members together. It starts private and only becomes shared when you invite someone."}
              </p>
              <div className="mt-8 space-y-3 text-sm text-white/80">
                {joining ? (
                  <>
                    <p>✓ Accept only invitations sent to your verified email</p>
                    <p>✓ Keep your personal login separate from other members</p>
                    <p>✓ See the same shared wallets, transactions, and reports</p>
                  </>
                ) : (
                  <>
                    <p>✓ Separate personal, family, travel, or business budgets</p>
                    <p>✓ Invite people using their own secure accounts</p>
                    <p>✓ Switch workspaces without mixing financial data</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-10">
            {!creatingAnother && (
              <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setMode("create")}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition ${mode === "create" ? "bg-white text-teal-700 shadow-sm dark:bg-[#14243a] dark:text-teal-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
                >
                  <FiPlusCircle className="h-4 w-4" /> Create a Budget
                </button>
                <button
                  type="button"
                  onClick={() => setMode("join")}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition ${mode === "join" ? "bg-white text-teal-700 shadow-sm dark:bg-[#14243a] dark:text-teal-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
                >
                  <FiUsers className="h-4 w-4" /> Join a Budget
                </button>
              </div>
            )}

            {!joining ? (
              <form onSubmit={submitCreate} className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Workspace setup</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Name your budget</h2>
                </div>
                <Field label="Workspace name" required>
                  <input autoFocus value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} className={inputClass} placeholder="Our Household Budget" maxLength={80} />
                </Field>
                <Field label="Description" hint="Optional">
                  <textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} className={textareaClass} placeholder="Shared household income, bills, and daily expenses" />
                </Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value }))} className={inputClass}>
                    <option value="PHP">PHP — Philippine Peso</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </Field>
                <PrimaryButton loading={creating} type="submit" className="w-full">Create workspace <FiArrowRight className="h-4 w-4" /></PrimaryButton>
              </form>
            ) : (
              <section aria-labelledby="join-budget-heading">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">Pending invitations</p>
                    <h2 id="join-budget-heading" className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Choose a budget to join</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Invitations sent to <strong>{user?.email}</strong> appear here.</p>
                  </div>
                  <button type="button" onClick={() => loadInvitations()} disabled={invitationsLoading} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-teal-300 hover:text-teal-700 disabled:opacity-50 dark:border-slate-700 dark:bg-white/[0.04] dark:text-slate-300" aria-label="Refresh invitations">
                    <FiRefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {invitationsLoading ? (
                  <div className="mt-6 space-y-3" aria-label="Loading invitations">
                    {[0, 1].map((item) => <SkeletonBlock key={item} className="h-36 rounded-2xl" />)}
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-white/[0.025]">
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300"><FiMail className="h-5 w-5" /></span>
                    <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">No pending invitations</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Ask the workspace owner to invite this exact email address, then refresh this list. You can also choose Create a Budget above.</p>
                    <SecondaryButton type="button" onClick={() => loadInvitations()} className="mt-4"><FiRefreshCw /> Check again</SecondaryButton>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {invitations.map((invitation) => (
                      <article key={invitation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-white/[0.03]">
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300"><FiMail className="h-5 w-5" /></span>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">{invitation.workspace?.name}</h3>
                            <p className="mt-1 text-xs text-slate-500">Invited as <strong className="capitalize">{invitation.role}</strong> by {invitation.inviter?.full_name || invitation.inviter?.email || "a workspace admin"}</p>
                            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400"><FiClock /> Expires {formatDate(invitation.expires_at.slice(0, 10))}</p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <SecondaryButton type="button" loading={invitationAction?.id === invitation.id && invitationAction.type === "decline"} disabled={invitationAction?.id === invitation.id} onClick={() => respondToInvitation(invitation, false)}><FiX /> Decline</SecondaryButton>
                          <PrimaryButton type="button" loading={invitationAction?.id === invitation.id && invitationAction.type === "accept"} disabled={invitationAction?.id === invitation.id} onClick={() => respondToInvitation(invitation, true)}><FiCheck /> Join budget</PrimaryButton>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
