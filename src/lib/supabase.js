import { createClient } from "@supabase/supabase-js";

const suppliedUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const suppliedKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(suppliedUrl && suppliedKey);
export const appUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, "");

const supabaseUrl = suppliedUrl || "https://placeholder.supabase.co";
const supabaseAnonKey = suppliedKey || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "pesowise-auth",
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});
