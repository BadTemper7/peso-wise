import { supabase } from "../lib/supabase";

export const workspaceService = {
  async list() {
    const { data, error } = await supabase
      .from("workspace_members")
      .select("id, role, joined_at, workspace:workspaces(id,name,description,currency,owner_id,settings,created_at,updated_at)")
      .order("joined_at", { ascending: true });
    if (error) throw error;
    return (data || []).map((membership) => ({ ...membership.workspace, membershipId: membership.id, role: membership.role, joinedAt: membership.joined_at }));
  },

  async create({ name, description, currency = "PHP" }) {
    const { data, error } = await supabase.rpc("create_workspace", {
      workspace_name: name,
      workspace_description: description || null,
      workspace_currency: currency,
    });
    if (error) throw error;
    return data;
  },

  async update(workspaceId, values) {
    const { data, error } = await supabase
      .from("workspaces")
      .update({
        name: values.name?.trim(),
        description: values.description?.trim() || null,
        currency: values.currency,
        settings: values.settings,
      })
      .eq("id", workspaceId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(workspaceId) {
    const { error } = await supabase.from("workspaces").delete().eq("id", workspaceId);
    if (error) throw error;
  },

  async leave(workspaceId) {
    const { error } = await supabase.rpc("leave_workspace", { p_workspace_id: workspaceId });
    if (error) throw error;
  },
};
