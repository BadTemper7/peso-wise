import { supabase } from "../lib/supabase";

const LOAN_SELECT = `
  *,
  savings_wallet:wallets!savings_loans_savings_wallet_id_fkey(id,name,currency,current_balance),
  destination_wallet:wallets!savings_loans_destination_wallet_id_fkey(id,name,type,currency,current_balance),
  borrower:profiles!savings_loans_borrowed_by_fkey(id,full_name,email,avatar_url)
`;

export const savingsService = {
  async reconcileMonthEnd(workspaceId) {
    const { error } = await supabase.rpc("request_month_end_reconciliation", { p_workspace_id: workspaceId });
    if (error) throw error;
  },

  async listLoans(workspaceId, { status } = {}) {
    let query = supabase
      .from("savings_loans")
      .select(LOAN_SELECT)
      .eq("workspace_id", workspaceId)
      .order("borrowed_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((loan) => ({
      ...loan,
      original_amount: Number(loan.original_amount || 0),
      outstanding_amount: Number(loan.outstanding_amount || 0),
    }));
  },

  async listClosures(workspaceId, monthStart) {
    const { data, error } = await supabase
      .from("wallet_month_closures")
      .select(`
        *,
        wallet:wallets!wallet_month_closures_wallet_id_fkey(id,name,type,currency),
        savings_wallet:wallets!wallet_month_closures_savings_wallet_id_fkey(id,name,currency),
        transfer:transactions!wallet_month_closures_transfer_transaction_id_fkey(id,amount,transaction_date,description)
      `)
      .eq("workspace_id", workspaceId)
      .eq("closing_month", monthStart)
      .order("processed_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((closure) => ({
      ...closure,
      balance_before_transfer: Number(closure.balance_before_transfer || 0),
      transferred_amount: Number(closure.transferred_amount || 0),
      balance_after_transfer: Number(closure.balance_after_transfer || 0),
    }));
  },

  async borrow({ workspaceId, destinationWalletId, amount, notes, transactionDate }) {
    const { data, error } = await supabase.rpc("borrow_from_savings", {
      p_workspace_id: workspaceId,
      p_destination_wallet_id: destinationWalletId,
      p_amount: Number(amount),
      p_notes: notes || null,
      p_transaction_date: transactionDate,
    });
    if (error) throw error;
    return data;
  },

  async repay({ loanId, sourceWalletId, amount, notes, transactionDate }) {
    const { data, error } = await supabase.rpc("repay_savings_loan", {
      p_loan_id: loanId,
      p_source_wallet_id: sourceWalletId,
      p_amount: Number(amount),
      p_notes: notes || null,
      p_transaction_date: transactionDate,
    });
    if (error) throw error;
    return data;
  },
};
