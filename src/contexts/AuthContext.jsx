import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authService } from "../services/authService";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const AuthContext = createContext(null);
const onboardingKey = (userId) => `pesowise-onboarding:${userId}`;

function fallbackProfile(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
    avatar_url: user.user_metadata?.avatar_url || null,
    onboarding_completed_at: window.localStorage.getItem(onboardingKey(user.id)) || null,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const requestId = useRef(0);

  const loadProfile = useCallback(async (user) => {
    const currentRequest = ++requestId.current;
    if (!user || !isSupabaseConfigured) {
      setProfile(null);
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);
    try {
      const nextProfile = await authService.getProfile(user.id);
      if (currentRequest !== requestId.current) return nextProfile;
      const resolved = nextProfile || fallbackProfile(user);
      setProfile(resolved);
      if (resolved?.onboarding_completed_at) {
        window.localStorage.setItem(onboardingKey(user.id), resolved.onboarding_completed_at);
      }
      return resolved;
    } catch {
      if (currentRequest !== requestId.current) return null;
      const fallback = fallbackProfile(user);
      setProfile(fallback);
      return fallback;
    } finally {
      if (currentRequest === requestId.current) setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!isSupabaseConfigured) {
      setLoading(false);
      setProfileLoading(false);
      setInitialized(true);
      return undefined;
    }

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const nextSession = data.session || null;
      setSession(nextSession);
      if (nextSession?.user) await loadProfile(nextSession.user);
      else {
        setProfile(null);
        setProfileLoading(false);
      }
      if (mounted) {
        setLoading(false);
        setInitialized(true);
      }
    };

    bootstrap().catch(() => {
      if (!mounted) return;
      setSession(null);
      setProfile(null);
      setLoading(false);
      setProfileLoading(false);
      setInitialized(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession || null);
      setLoading(false);
      setInitialized(true);
      if (nextSession?.user) {
        loadProfile(nextSession.user).catch(() => {});
      } else {
        requestId.current += 1;
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => {
      mounted = false;
      requestId.current += 1;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(session?.user), [loadProfile, session?.user]);

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile,
    loading,
    profileLoading,
    initialized,
    configured: isSupabaseConfigured,
    refreshProfile,
    login: authService.login,
    register: authService.register,
    logout: authService.logout,
    forgotPassword: authService.forgotPassword,
    updatePassword: authService.updatePassword,
    updateProfile: authService.updateProfile,
  }), [session, profile, loading, profileLoading, initialized, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
