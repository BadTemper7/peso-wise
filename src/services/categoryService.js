import { supabase } from "../lib/supabase";

export const categoryService = {
  async list(workspaceId, type) {
    let query = supabase.from("categories").select("*").eq("workspace_id", workspaceId).eq("is_archived", false).order("name");
    if (type) query = query.eq("type", type);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(workspaceId, userId, values) {
    const { data, error } = await supabase.from("categories").insert({
      workspace_id: workspaceId,
      name: values.name.trim(),
      type: values.type,
      icon: values.icon || null,
      color: values.color || "#14b8a6",
      created_by: userId,
    }).select().single();
    if (error) throw error;
    return data;
  },
};
