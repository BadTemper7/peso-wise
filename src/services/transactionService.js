import { supabase } from "../lib/supabase";

const TRANSACTION_SELECT = `
  *,
  wallet:wallets!transactions_wallet_id_fkey(id,name,type,currency),
  from_wallet:wallets!transactions_from_wallet_id_fkey(id,name,type,currency),
  to_wallet:wallets!transactions_to_wallet_id_fkey(id,name,type,currency),
  category:categories(id,name,type,icon,color),
  creator:profiles!transactions_created_by_fkey(id,full_name,avatar_url,email)
`;

export const transactionService = {
  async list(workspaceId, filters = {}) {
    let query = supabase
      .from("transactions")
      .select(TRANSACTION_SELECT)
      .eq("workspace_id", workspaceId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (filters.startDate) query = query.gte("transaction_date", filters.startDate);
    if (filters.endDate) query = query.lte("transaction_date", filters.endDate);
    if (filters.type && filters.type !== "all") query = query.eq("type", filters.type);
    if (filters.walletId) query = query.or(`wallet_id.eq.${filters.walletId},from_wallet_id.eq.${filters.walletId},to_wallet_id.eq.${filters.walletId}`);
    if (filters.limit) query = query.limit(filters.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(workspaceId, userId, values) {
    if (values.type === "transfer") {
      const { data, error } = await supabase.rpc("create_transfer", {
        p_workspace_id: workspaceId,
        p_from_wallet_id: values.fromWalletId,
        p_to_wallet_id: values.toWalletId,
        p_amount: Number(values.amount),
        p_description: values.description || "",
        p_transaction_date: values.transactionDate,
      });
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase.from("transactions").insert({
      workspace_id: workspaceId,
      wallet_id: values.walletId,
      type: values.type,
      amount: Number(values.amount),
      category_id: values.categoryId,
      description: values.description.trim(),
      transaction_date: values.transactionDate,
      created_by: userId,
      updated_by: userId,
    }).select(TRANSACTION_SELECT).single();
    if (error) throw error;
    return data;
  },

  async update(transactionId, userId, values) {
    if (values.type === "transfer") throw new Error("Transfer editing is not supported. Delete and recreate the transfer.");
    const { data, error } = await supabase.from("transactions").update({
      wallet_id: values.walletId,
      type: values.type,
      amount: Number(values.amount),
      category_id: values.categoryId,
      description: values.description.trim(),
      transaction_date: values.transactionDate,
      from_wallet_id: null,
      to_wallet_id: null,
      updated_by: userId,
    }).eq("id", transactionId).select(TRANSACTION_SELECT).single();
    if (error) throw error;
    return data;
  },

  async remove(transactionId) {
    const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
    if (error) throw error;
  },
};
