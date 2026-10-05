import { supabase } from "../lib/supabase";

export const invitationService = {
  async listWorkspaceInvitations(workspaceId) {
    const { data, error } = await supabase.from("workspace_invitations").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async listMine() {
    const { data, error } = await supabase
      .from("workspace_invitations")
      .select("*, workspace:workspaces(id,name,description,currency), inviter:profiles!workspace_invitations_invited_by_fkey(full_name,email)")
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async invite(workspaceId, email, role) {
    const { data, error } = await supabase.rpc("invite_workspace_member", { p_workspace_id: workspaceId, p_email: email, p_role: role });
    if (error) throw error;
    try {
      await supabase.functions.invoke("send-workspace-invite", { body: { invitationId: data.id } });
    } catch {
      // The database invitation remains valid even when optional email delivery is not configured.
    }
    return data;
  },

  async accept(invitationId) {
    const { data, error } = await supabase.rpc("accept_workspace_invitation", { p_invitation_id: invitationId });
    if (error) throw error;
    return data;
  },

  async decline(invitationId) {
    const { error } = await supabase.rpc("decline_workspace_invitation", { p_invitation_id: invitationId });
    if (error) throw error;
  },

  async cancel(invitationId) {
    const { error } = await supabase.rpc("cancel_workspace_invitation", { p_invitation_id: invitationId });
    if (error) throw error;
  },
};
