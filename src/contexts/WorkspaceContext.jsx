import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { workspaceService } from "../services/workspaceService";
import { useAuth } from "./AuthContext";

const WorkspaceContext = createContext(null);
const LEGACY_STORAGE_KEY = "pesowise-active-workspace";
const workspaceKey = (userId) => `pesowise-active-workspace:${userId}`;
const onboardingKey = (userId) => `pesowise-onboarding:${userId}`;

export function WorkspaceProvider({ children }) {
  const { user, profile, loading: authLoading, profileLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const refreshWorkspaces = useCallback(async ({ keepSelection = true, silent = false } = {}) => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      setLoadedUserId(null);
      setFetching(false);
      return [];
    }

    const currentRequest = ++requestId.current;
    if (!silent || loadedUserId !== user.id) setFetching(true);
    setError(null);

    try {
      let next = await workspaceService.list();
      const knownOnboardingComplete = Boolean(
        profile?.onboarding_completed_at || window.localStorage.getItem(onboardingKey(user.id))
      );
      // A restored auth session can finish before the membership query has fully settled.
      // Always verify an empty result before onboarding decisions, then give known-complete
      // accounts one additional check. A genuinely new account only waits a short moment.
      if (next.length === 0) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        if (currentRequest !== requestId.current) return next;
        next = await workspaceService.list();
      }
      if (next.length === 0 && knownOnboardingComplete) {
        await new Promise((resolve) => window.setTimeout(resolve, 600));
        if (currentRequest !== requestId.current) return next;
        next = await workspaceService.list();
      }
      if (currentRequest !== requestId.current) return next;
      setWorkspaces(next);
      setLoadedUserId(user.id);
      setActiveWorkspaceId((current) => {
        const storage = workspaceKey(user.id);
        const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        const stored = keepSelection ? current || window.localStorage.getItem(storage) || legacy : null;
        const valid = next.some((workspace) => workspace.id === stored);
        const selected = valid ? stored : next[0]?.id || null;
        if (selected) {
          window.localStorage.setItem(storage, selected);
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        } else {
          window.localStorage.removeItem(storage);
        }
        return selected;
      });
      if (next.length > 0) {
        window.localStorage.setItem(onboardingKey(user.id), profile?.onboarding_completed_at || new Date().toISOString());
      }
      return next;
    } catch (nextError) {
      if (currentRequest === requestId.current) {
        setError(nextError);
        setLoadedUserId(user.id);
      }
      throw nextError;
    } finally {
      if (currentRequest === requestId.current) setFetching(false);
    }
  }, [user, profile?.onboarding_completed_at, loadedUserId]);

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user) {
      requestId.current += 1;
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      setLoadedUserId(null);
      setFetching(false);
      setError(null);
      return;
    }

    if (loadedUserId !== user.id) {
      setWorkspaces([]);
      setActiveWorkspaceId(window.localStorage.getItem(workspaceKey(user.id)) || null);
      refreshWorkspaces().catch(() => {});
    }
  }, [user, authLoading, profileLoading, loadedUserId, refreshWorkspaces]);

  const switchWorkspace = useCallback((workspaceId) => {
    if (!workspaceId || !user) return;
    setActiveWorkspaceId(workspaceId);
    window.localStorage.setItem(workspaceKey(user.id), workspaceId);
  }, [user]);

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null;
  const initialized = !authLoading && !profileLoading && (!user || loadedUserId === user.id);
  const loading = !initialized || fetching;
  const onboardingComplete = Boolean(
    profile?.onboarding_completed_at
    || (user && window.localStorage.getItem(onboardingKey(user.id)))
    || workspaces.length > 0
  );

  const value = useMemo(() => ({
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    role: activeWorkspace?.role || null,
    loading,
    fetching,
    initialized,
    onboardingComplete,
    error,
    refreshWorkspaces,
    switchWorkspace,
  }), [workspaces, activeWorkspace, activeWorkspaceId, loading, fetching, initialized, onboardingComplete, error, refreshWorkspaces, switchWorkspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
