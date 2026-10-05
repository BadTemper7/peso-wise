import { supabase } from "../lib/supabase";

export const memberService = {
  async list(workspaceId) {
    const { data, error } = await supabase
      .from("workspace_members")
      .select("id,workspace_id,user_id,role,joined_at,profile:profiles(id,full_name,email,avatar_url)")
      .eq("workspace_id", workspaceId)
      .order("joined_at");
    if (error) throw error;
    return data || [];
  },

  async changeRole(workspaceId, userId, role) {
    const { data, error } = await supabase.rpc("change_workspace_member_role", { p_workspace_id: workspaceId, p_user_id: userId, p_role: role });
    if (error) throw error;
    return data;
  },

  async remove(workspaceId, userId) {
    const { error } = await supabase.rpc("remove_workspace_member", { p_workspace_id: workspaceId, p_user_id: userId });
    if (error) throw error;
  },

  async transferOwnership(workspaceId, userId) {
    const { error } = await supabase.rpc("transfer_workspace_ownership", { p_workspace_id: workspaceId, p_new_owner_id: userId });
    if (error) throw error;
  },
};
