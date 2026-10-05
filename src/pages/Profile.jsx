import React, { useState } from "react";
import { FiSave, FiUser } from "react-icons/fi";
import { Field, inputClass, PrimaryButton } from "../components/common/FormControls";
import PageHeader from "../components/common/PageHeader";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getFriendlyError } from "../utils/errors";

export default function Profile() {
  const { user, profile, updateProfile, refreshProfile } = useAuth(); const toast = useToast();
  const [form, setForm] = useState({ fullName:profile?.full_name || "", avatarUrl:profile?.avatar_url || "" }); const [loading,setLoading]=useState(false);
  const submit = async (event) => { event.preventDefault(); setLoading(true); try { await updateProfile(user.id,form); await refreshProfile({ silent: true }); toast.success("Profile updated."); } catch (error) { toast.error(getFriendlyError(error)); } finally { setLoading(false); } };
  const initials=(form.fullName || user.email || "U").split(/\s+/).map((part)=>part[0]).join("").slice(0,2).toUpperCase();
  return <div><PageHeader title="Your profile" description="Manage the name and avatar shown to other members in shared workspaces." /><form onSubmit={submit} className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2b]"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-teal-400 text-lg font-bold text-white">{form.avatarUrl ? <img src={form.avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : initials}</div><div><p className="font-bold text-slate-900 dark:text-white">{profile?.full_name || "PesoWise user"}</p><p className="mt-1 text-sm text-slate-400">{user.email}</p></div></div><div className="mt-7 space-y-5"><Field label="Full name" required><input value={form.fullName} onChange={(e)=>setForm((v)=>({...v,fullName:e.target.value}))} className={inputClass} /></Field><Field label="Avatar URL" hint="Optional"><input type="url" value={form.avatarUrl} onChange={(e)=>setForm((v)=>({...v,avatarUrl:e.target.value}))} className={inputClass} placeholder="https://…" /></Field><Field label="Account email"><input value={user.email} disabled className={inputClass} /></Field><PrimaryButton type="submit" loading={loading}><FiSave /> Save profile</PrimaryButton></div></form></div>;
}
