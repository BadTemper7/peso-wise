import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user) => {
    if (!user || !isSupabaseConfigured) {
      setProfile(null);
      return null;
    }
    try {
      const nextProfile = await authService.getProfile(user.id);
      setProfile(nextProfile || {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
      });
      return nextProfile;
    } catch {
      const fallback = { id: user.id, email: user.email, full_name: user.user_metadata?.full_name || user.email?.split("@")[0] };
      setProfile(fallback);
      return fallback;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      if (data.session?.user) await loadProfile(data.session.user);
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      if (nextSession?.user) loadProfile(nextSession.user);
      else setProfile(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(session?.user), [loadProfile, session?.user]);

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile,
    loading,
    configured: isSupabaseConfigured,
    refreshProfile,
    login: authService.login,
    register: authService.register,
    logout: authService.logout,
    forgotPassword: authService.forgotPassword,
    updatePassword: authService.updatePassword,
    updateProfile: authService.updateProfile,
  }), [session, profile, loading, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
