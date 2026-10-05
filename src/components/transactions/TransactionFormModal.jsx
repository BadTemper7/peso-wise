import React, { useEffect, useMemo, useState } from "react";
import Modal from "../common/Modal";
import { Field, inputClass, PrimaryButton, SecondaryButton, textareaClass } from "../common/FormControls";
import { transactionService } from "../../services/transactionService";
import { getFriendlyError } from "../../utils/errors";
import { useToast } from "../../contexts/ToastContext";

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = { type: "expense", amount: "", walletId: "", categoryId: "", fromWalletId: "", toWalletId: "", description: "", transactionDate: today() };

export default function TransactionFormModal({ open, onClose, workspaceId, userId, wallets, categories, initialTransaction, presetType, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const editing = Boolean(initialTransaction?.id);

  useEffect(() => {
    if (!open) return;
    if (initialTransaction) {
      setForm({
        type: initialTransaction.type,
        amount: String(initialTransaction.amount),
        walletId: initialTransaction.wallet_id || "",
        categoryId: initialTransaction.category_id || "",
        fromWalletId: initialTransaction.from_wallet_id || "",
        toWalletId: initialTransaction.to_wallet_id || "",
        description: initialTransaction.description || "",
        transactionDate: initialTransaction.transaction_date || today(),
      });
    } else {
      const type = presetType || "expense";
      setForm({ ...emptyForm, type, walletId: wallets[0]?.id || "", fromWalletId: wallets[0]?.id || "", toWalletId: wallets[1]?.id || "", categoryId: categories.find((category) => category.type === type)?.id || "" });
    }
  }, [open, initialTransaction, presetType, wallets, categories]);

  const availableCategories = useMemo(() => categories.filter((category) => category.type === form.type), [categories, form.type]);

  const updateType = (type) => setForm((current) => ({ ...current, type, categoryId: categories.find((category) => category.type === type)?.id || "" }));

  const submit = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("Enter a positive transaction amount.");
    if (form.type === "transfer") {
      if (!form.fromWalletId || !form.toWalletId) return toast.error("Choose both wallets.");
      if (form.fromWalletId === form.toWalletId) return toast.error("Choose two different wallets.");
    } else {
      if (!form.walletId) return toast.error("Choose a wallet.");
      if (!form.categoryId) return toast.error("Choose a category.");
    }
    setLoading(true);
    try {
      const payload = { ...form, amount };
      const saved = editing ? await transactionService.update(initialTransaction.id, userId, payload) : await transactionService.create(workspaceId, userId, payload);
      toast.success(editing ? "Transaction updated." : "Transaction added.");
      onSaved?.(saved);
      onClose();
    } catch (error) { toast.error(getFriendlyError(error, "Could not save the transaction.")); }
    finally { setLoading(false); }
  };

  return <Modal open={open} onClose={onClose} title={editing ? "Edit transaction" : "Add transaction"} description="Record income, an expense, or a transfer inside the active workspace." maxWidth="max-w-xl" footer={<div className="flex justify-end gap-2"><SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton><PrimaryButton type="submit" form="transaction-form" loading={loading}>{editing ? "Save changes" : "Add transaction"}</PrimaryButton></div>}>
    <form id="transaction-form" onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-3 gap-2">{["income","expense","transfer"].map((type) => <button key={type} type="button" disabled={editing && initialTransaction?.type === "transfer"} onClick={() => updateType(type)} className={`rounded-xl border px-3 py-3 text-xs font-bold capitalize transition ${form.type === type ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300" : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/[0.04]"}`}>{type}</button>)}</div>
      <Field label="Amount" required><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₱</span><input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm((v) => ({ ...v, amount: e.target.value }))} className={`${inputClass} pl-8`} placeholder="0.00" /></div></Field>
      {form.type === "transfer" ? <div className="grid gap-4 sm:grid-cols-2"><Field label="From wallet" required><select value={form.fromWalletId} onChange={(e) => setForm((v) => ({ ...v, fromWalletId: e.target.value }))} className={inputClass}><option value="">Select wallet</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></Field><Field label="To wallet" required><select value={form.toWalletId} onChange={(e) => setForm((v) => ({ ...v, toWalletId: e.target.value }))} className={inputClass}><option value="">Select wallet</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></Field></div> : <div className="grid gap-4 sm:grid-cols-2"><Field label="Wallet" required><select value={form.walletId} onChange={(e) => setForm((v) => ({ ...v, walletId: e.target.value }))} className={inputClass}><option value="">Select wallet</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></Field><Field label="Category" required><select value={form.categoryId} onChange={(e) => setForm((v) => ({ ...v, categoryId: e.target.value }))} className={inputClass}><option value="">Select category</option>{availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field></div>}
      <Field label="Date" required><input type="date" value={form.transactionDate} onChange={(e) => setForm((v) => ({ ...v, transactionDate: e.target.value }))} className={inputClass} /></Field>
      <Field label="Description" required={form.type !== "transfer"}><textarea value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} className={textareaClass} placeholder={form.type === "expense" ? "What did you spend on?" : form.type === "income" ? "Where did the income come from?" : "Optional transfer note"} required={form.type !== "transfer"} /></Field>
    </form>
  </Modal>;
}
