import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import ConfigurationNotice from "../common/ConfigurationNotice";
import LoadingScreen from "../common/LoadingScreen";

export function RequireAuth() {
  const { user, loading, configured } = useAuth();
  const location = useLocation();
  if (!configured) return <ConfigurationNotice />;
  if (loading) return <LoadingScreen label="Checking your account…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

export function RequireWorkspace() {
  const { loading, activeWorkspace, workspaces } = useWorkspace();
  if (loading) return <LoadingScreen label="Loading your workspaces…" />;
  if (!activeWorkspace && workspaces.length === 0) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function PublicOnly() {
  const { user, loading, configured } = useAuth();
  if (!configured) return <ConfigurationNotice />;
  if (loading) return <LoadingScreen label="Loading PesoWise…" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
