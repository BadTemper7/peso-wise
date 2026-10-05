import { supabase } from "../lib/supabase";
import { getMonthBounds } from "../utils/date";

const WALLET_SELECT = `
  *,
  creator:profiles!wallets_created_by_fkey(id,full_name,email,avatar_url)
`;

export const walletService = {
  async list(workspaceId, { includeArchived = false } = {}) {
    let query = supabase
      .from("wallets")
      .select(WALLET_SELECT)
      .eq("workspace_id", workspaceId)
      .order("is_savings", { ascending: true })
      .order("created_at", { ascending: true });
    if (!includeArchived) query = query.eq("is_archived", false);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async listForMonth(workspaceId, monthValue, { includeArchived = false } = {}) {
    const { start } = getMonthBounds(monthValue);
    const { data, error } = await supabase.rpc("get_wallet_month_snapshot", {
      p_workspace_id: workspaceId,
      p_month_start: start,
      p_include_archived: includeArchived,
    });
    if (error) throw error;
    return (data || []).map((wallet) => ({
      ...wallet,
      current_balance: Number(wallet.closing_balance ?? wallet.current_balance ?? 0),
      initial_balance: Number(wallet.initial_balance || 0),
      opening_balance: Number(wallet.opening_balance || 0),
      month_income: Number(wallet.month_income || 0),
      month_expenses: Number(wallet.month_expenses || 0),
      transfers_in: Number(wallet.transfers_in || 0),
      transfers_out: Number(wallet.transfers_out || 0),
      month_end_savings: Number(wallet.month_end_savings || 0),
      balance_before_savings: Number(wallet.balance_before_savings || 0),
      closing_balance: Number(wallet.closing_balance || 0),
    }));
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
        opening_balance_effective_date: values.openingBalanceEffectiveDate,
        created_by: userId,
        is_savings: false,
      })
      .select(WALLET_SELECT)
      .single();
    if (error) throw error;
    return data;
  },

  async update(walletId, values) {
    const { data, error } = await supabase
      .from("wallets")
      .update({
        name: values.name.trim(),
        type: values.type,
        currency: values.currency,
        opening_balance_effective_date: values.openingBalanceEffectiveDate,
      })
      .eq("id", walletId)
      .select(WALLET_SELECT)
      .single();
    if (error) throw error;
    return data;
  },

  async remove(walletId) {
    const { data, error } = await supabase
      .from("wallets")
      .delete()
      .eq("id", walletId)
      .select("id,name")
      .single();
    if (error) throw error;
    return data;
  },

  async archive(walletId, archived = true) {
    const { data, error } = await supabase
      .from("wallets")
      .update({ is_archived: archived })
      .eq("id", walletId)
      .select(WALLET_SELECT)
      .single();
    if (error) throw error;
    return data;
  },
};
