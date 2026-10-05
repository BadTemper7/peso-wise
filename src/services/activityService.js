import { supabase } from "../lib/supabase";

export const activityService = {
  async list(workspaceId, limit = 12) {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*, user:profiles(id,full_name,avatar_url,email)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};
