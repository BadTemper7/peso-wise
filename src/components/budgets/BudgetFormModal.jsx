import React, { useEffect, useState } from "react";
import Modal from "../common/Modal";
import { Field, inputClass, PrimaryButton, SecondaryButton } from "../common/FormControls";
import { budgetService } from "../../services/budgetService";
import { useToast } from "../../contexts/ToastContext";
import { getFriendlyError } from "../../utils/errors";

export default function BudgetFormModal({ open, onClose, workspaceId, userId, monthStart, categories, budget, onSaved }) {
  const toast = useToast(); const [form, setForm] = useState({ categoryId: "", limitAmount: "" }); const [loading, setLoading] = useState(false);
  useEffect(() => { if (open) setForm(budget ? { categoryId: budget.category_id, limitAmount: String(budget.limit_amount) } : { categoryId: categories[0]?.id || "", limitAmount: "" }); }, [open, budget, categories]);
  const submit = async (event) => { event.preventDefault(); if (!form.categoryId || Number(form.limitAmount) <= 0) return toast.error("Choose a category and enter a positive limit."); setLoading(true); try { const saved = await budgetService.upsert(workspaceId, userId, { ...form, monthStart }); toast.success("Budget limit saved."); onSaved?.(saved); onClose(); } catch (error) { toast.error(getFriendlyError(error)); } finally { setLoading(false); } };
  return <Modal open={open} onClose={onClose} title={budget ? "Edit budget" : "Create monthly budget"} description="Set a spending limit for one expense category." footer={<div className="flex justify-end gap-2"><SecondaryButton onClick={onClose}>Cancel</SecondaryButton><PrimaryButton type="submit" form="budget-form" loading={loading}>Save budget</PrimaryButton></div>}><form id="budget-form" onSubmit={submit} className="space-y-5"><Field label="Expense category" required><select value={form.categoryId} onChange={(e) => setForm((v) => ({ ...v, categoryId: e.target.value }))} className={inputClass} disabled={Boolean(budget)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field><Field label="Monthly limit" required><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₱</span><input type="number" min="0.01" step="0.01" value={form.limitAmount} onChange={(e) => setForm((v) => ({ ...v, limitAmount: e.target.value }))} className={`${inputClass} pl-8`} placeholder="8000.00" /></div></Field></form></Modal>;
}
