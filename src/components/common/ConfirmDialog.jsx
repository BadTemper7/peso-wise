import React from "react";
import Modal from "./Modal";
import { PrimaryButton, SecondaryButton } from "./FormControls";

export default function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", loading, danger = false }) {
  return <Modal open={open} onClose={onClose} title={title} description={description} maxWidth="max-w-md" footer={<div className="flex justify-end gap-2"><SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton><PrimaryButton type="button" loading={loading} onClick={onConfirm} className={danger ? "!bg-rose-500 !text-white hover:!bg-rose-600" : ""}>{confirmLabel}</PrimaryButton></div>}><p className="text-sm leading-6 text-slate-500 dark:text-slate-400">This action may affect everyone in the active workspace.</p></Modal>;
}
