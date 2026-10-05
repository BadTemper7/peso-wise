import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { workspaceService } from "../services/workspaceService";
import { useAuth } from "./AuthContext";

const WorkspaceContext = createContext(null);
const STORAGE_KEY = "pesowise-active-workspace";

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => window.localStorage.getItem(STORAGE_KEY));
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState(null);

  const refreshWorkspaces = useCallback(async ({ keepSelection = true } = {}) => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      setLoading(false);
      return [];
    }
    setLoading(true);
    setError(null);
    try {
      const next = await workspaceService.list();
      setWorkspaces(next);
      setActiveWorkspaceId((current) => {
        const stored = keepSelection ? current || window.localStorage.getItem(STORAGE_KEY) : null;
        const valid = next.some((workspace) => workspace.id === stored);
        const selected = valid ? stored : next[0]?.id || null;
        if (selected) window.localStorage.setItem(STORAGE_KEY, selected);
        else window.localStorage.removeItem(STORAGE_KEY);
        return selected;
      });
      return next;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshWorkspaces().catch(() => {});
    else {
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      setLoading(false);
    }
  }, [user, refreshWorkspaces]);

  const switchWorkspace = useCallback((workspaceId) => {
    if (!workspaceId) return;
    setActiveWorkspaceId(workspaceId);
    window.localStorage.setItem(STORAGE_KEY, workspaceId);
  }, []);

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null;

  const value = useMemo(() => ({
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    role: activeWorkspace?.role || null,
    loading,
    error,
    refreshWorkspaces,
    switchWorkspace,
  }), [workspaces, activeWorkspace, activeWorkspaceId, loading, error, refreshWorkspaces, switchWorkspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
