import { supabase } from "../lib/supabase";

export const walletService = {
  async list(workspaceId, { includeArchived = false } = {}) {
    let query = supabase.from("wallets").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: true });
    if (!includeArchived) query = query.eq("is_archived", false);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(workspaceId, userId, values) {
    const initial = Number(values.initialBalance || 0);
    const { data, error } = await supabase
      .from("wallets")
      .insert({
        workspace_id: workspaceId,
        name: values.name.trim(),
        type: values.type,
        initial_balance: initial,
        current_balance: initial,
        currency: values.currency || "PHP",
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(walletId, values) {
    const { data, error } = await supabase
      .from("wallets")
      .update({ name: values.name.trim(), type: values.type, currency: values.currency })
      .eq("id", walletId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async archive(walletId, archived = true) {
    const { data, error } = await supabase.from("wallets").update({ is_archived: archived }).eq("id", walletId).select().single();
    if (error) throw error;
    return data;
  },
};
