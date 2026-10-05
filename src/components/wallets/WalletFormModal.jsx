import React, { useEffect, useState } from "react";
import { getTodayValue } from "../../utils/date";
import { FiCreditCard, FiDollarSign, FiSmartphone } from "react-icons/fi";
import Modal from "../common/Modal";
import { Field, inputClass, PrimaryButton, SecondaryButton } from "../common/FormControls";
import { WALLET_TYPES } from "../../lib/constants";
import { walletService } from "../../services/walletService";
import { useToast } from "../../contexts/ToastContext";
import { getFriendlyError } from "../../utils/errors";

const typeIcons = { cash: FiDollarSign, ewallet: FiSmartphone, debit: FiCreditCard, credit: FiCreditCard };

export default function WalletFormModal({ open, onClose, workspaceId, userId, currency = "PHP", wallet, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", type: "cash", initialBalance: "0", currency, openingBalanceEffectiveDate: getTodayValue() });
  const [loading, setLoading] = useState(false);
  const editing = Boolean(wallet?.id);
  const savingsWallet = Boolean(wallet?.is_savings);

  useEffect(() => {
    if (!open) return;
    setForm(wallet ? {
      name: wallet.name,
      type: wallet.type,
      initialBalance: String(wallet.initial_balance),
      currency: wallet.currency,
      openingBalanceEffectiveDate: wallet.opening_balance_effective_date || wallet.created_at?.slice(0, 10) || getTodayValue(),
    } : {
      name: "",
      type: "cash",
      initialBalance: "0",
      currency,
      openingBalanceEffectiveDate: getTodayValue(),
    });
  }, [open, wallet, currency]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Enter a wallet name.");
    if (!form.openingBalanceEffectiveDate) return toast.error("Choose the opening balance date.");
    setLoading(true);
    try {
      const saved = editing ? await walletService.update(wallet.id, form) : await walletService.create(workspaceId, userId, form);
      toast.success(editing ? "Wallet updated." : "Wallet created.");
      onSaved?.(saved);
      onClose();
    } catch (error) {
      toast.error(getFriendlyError(error, "Could not save the wallet."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit wallet" : "Create wallet"} description={savingsWallet ? "Savings is the workspace reserve and cannot be converted or archived." : "Choose the wallet setup that matches how the account is used."} footer={<div className="flex justify-end gap-2"><SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton><PrimaryButton type="submit" form="wallet-form" loading={loading}>{editing ? "Save wallet" : "Create wallet"}</PrimaryButton></div>}>
      <form id="wallet-form" onSubmit={submit} className="space-y-5">
        <Field label="Wallet name" required><input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} className={inputClass} placeholder="GCash, Cash, BPI Debit…" maxLength={60} /></Field>
        <Field label="Wallet setup" required>
          <div className="grid grid-cols-2 gap-2">{WALLET_TYPES.map((type) => { const Icon = typeIcons[type.value]; return <button key={type.value} type="button" disabled={savingsWallet} onClick={() => setForm((value) => ({ ...value, type: type.value }))} className={`rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${form.type === type.value ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/10 dark:bg-teal-400/10" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/[0.04]"}`}><Icon className={`h-4 w-4 ${form.type === type.value ? "text-teal-600 dark:text-teal-300" : "text-slate-400"}`} /><span className="mt-2 block text-xs font-bold text-slate-800 dark:text-white">{type.label}</span><span className="mt-1 block text-[10px] leading-4 text-slate-400">{type.description}</span></button>; })}</div>
        </Field>
        {!editing && <Field label={form.type === "credit" ? "Starting credit balance" : "Initial balance"} hint={form.type === "credit" ? "Use a negative value for amount owed" : "Can be zero"}><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₱</span><input type="number" step="0.01" value={form.initialBalance} onChange={(event) => setForm((value) => ({ ...value, initialBalance: event.target.value }))} className={`${inputClass} pl-8`} /></div></Field>}
        {!editing && <Field label="Opening balance effective date" required hint="Months before this date show ₱0"><input type="date" max={getTodayValue()} value={form.openingBalanceEffectiveDate} onChange={(event) => setForm((value) => ({ ...value, openingBalanceEffectiveDate: event.target.value }))} className={inputClass} /></Field>}
        {editing && <Field label="Opening balance effective date"><input type="date" value={form.openingBalanceEffectiveDate} className={inputClass} disabled /><p className="mt-1.5 text-[10px] leading-4 text-slate-400">The effective date is locked after wallet creation to protect historical balances.</p></Field>}
        <Field label="Currency"><select value={form.currency} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value }))} className={inputClass}><option value="PHP">PHP — Philippine Peso</option><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option></select></Field>
      </form>
    </Modal>
  );
}
