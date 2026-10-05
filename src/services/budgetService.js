import { supabase } from "../lib/supabase";

export const budgetService = {
  async list(workspaceId, monthStart) {
    const { data, error } = await supabase
      .from("budgets")
      .select("*, category:categories(id,name,color,icon,type)")
      .eq("workspace_id", workspaceId)
      .eq("month_start", monthStart)
      .order("created_at");
    if (error) throw error;
    return data || [];
  },

  async upsert(workspaceId, userId, values) {
    const { data, error } = await supabase.from("budgets").upsert({
      workspace_id: workspaceId,
      category_id: values.categoryId,
      month_start: values.monthStart,
      limit_amount: Number(values.limitAmount),
      created_by: userId,
    }, { onConflict: "workspace_id,category_id,month_start" }).select("*, category:categories(id,name,color,icon,type)").single();
    if (error) throw error;
    return data;
  },

  async remove(budgetId) {
    const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
    if (error) throw error;
  },
};
