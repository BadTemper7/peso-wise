import { appUrl, supabase } from "../lib/supabase";

export const authService = {
  async register({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
        data: { full_name: fullName.trim() },
      },
    });
    if (error) throw error;
    return data;
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async forgotPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${appUrl}/reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(password) {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
  },

  async updateProfile(userId, values) {
    const payload = {
      full_name: values.fullName?.trim() || null,
      avatar_url: values.avatarUrl?.trim() || null,
    };
    const { data, error } = await supabase.from("profiles").update(payload).eq("id", userId).select().single();
    if (error) throw error;
    await supabase.auth.updateUser({ data: { full_name: payload.full_name, avatar_url: payload.avatar_url } });
    return data;
  },

  async getProfile(userId) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    return data;
  },
};
