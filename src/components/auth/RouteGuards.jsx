import React from "react";
import { FiRefreshCw } from "react-icons/fi";
import { Navigate, Outlet, useLocation } from "react-router";
import Logo from "../../assets/logo.webp";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import ConfigurationNotice from "../common/ConfigurationNotice";
import LoadingScreen from "../common/LoadingScreen";

export function RequireAuth() {
  const { user, loading, initialized, configured } = useAuth();
  const location = useLocation();
  if (!configured) return <ConfigurationNotice />;
  if (loading || !initialized) return <LoadingScreen label="Checking your account…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

export function RequireWorkspace() {
  const { loading, initialized, activeWorkspace, workspaces, error, refreshWorkspaces } = useWorkspace();
  if (loading || !initialized) return <LoadingScreen label="Loading your workspaces…" />;
  if (error && workspaces.length === 0) return <WorkspaceLoadError error={error} onRetry={() => refreshWorkspaces().catch(() => {})} />;
  if (!activeWorkspace && workspaces.length === 0) return <Navigate to="/onboarding" replace />;
  if (!activeWorkspace && workspaces.length > 0) return <LoadingScreen label="Restoring your workspace…" />;
  return <Outlet />;
}

export function PublicOnly() {
  const { user, loading, initialized, configured } = useAuth();
  if (!configured) return <ConfigurationNotice />;
  if (loading || !initialized) return <LoadingScreen label="Loading PesoWise…" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function WorkspaceLoadError({ error, onRetry }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-6 dark:bg-[#07111f]">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl dark:border-slate-800 dark:bg-[#0d1a2b]">
        <img src={Logo} alt="PesoWise" className="mx-auto h-14 w-14 rounded-2xl object-contain" />
        <h1 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">Could not load your workspace</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{error?.message || "Check your connection and try again. Your onboarding status has not been changed."}</p>
        <button type="button" onClick={onRetry} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 text-sm font-bold text-slate-950 hover:bg-teal-400"><FiRefreshCw /> Try again</button>
      </div>
    </div>
  );
}
