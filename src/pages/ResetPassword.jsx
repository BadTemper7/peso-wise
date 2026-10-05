import React, { useState } from "react";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { useNavigate } from "react-router";
import AuthShell from "../components/auth/AuthShell";
import { PrimaryButton } from "../components/common/FormControls";
import { useAuth } from "../contexts/AuthContext";
import { getFriendlyError } from "../utils/errors";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const submit = async (event) => { event.preventDefault(); setError(""); if (password.length < 8) return setError("Use at least 8 characters."); if (password !== confirm) return setError("Passwords do not match."); setLoading(true); try { await updatePassword(password); navigate("/dashboard", { replace: true }); } catch (nextError) { setError(getFriendlyError(nextError)); } finally { setLoading(false); } };
  const input = "h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-11 pr-12 text-sm text-white outline-none focus:border-teal-400/60 focus:ring-4 focus:ring-teal-400/10";
  return <AuthShell title="Choose a new password" description="Create a strong password for your PesoWise account."><form onSubmit={submit} className="space-y-4">{error && <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}{[["New password",password,setPassword],["Confirm password",confirm,setConfirm]].map(([label,value,setter]) => <div key={label}><label className="mb-1.5 block text-xs font-semibold text-slate-300">{label}</label><div className="relative"><FiLock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type={show ? "text" : "password"} required value={value} onChange={(e) => setter(e.target.value)} className={input} /><button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white">{show ? <FiEyeOff /> : <FiEye />}</button></div></div>)}<PrimaryButton type="submit" loading={loading} className="h-12 w-full">Update password</PrimaryButton></form></AuthShell>;
}
