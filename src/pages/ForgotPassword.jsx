import React, { useState } from "react";
import { FiMail } from "react-icons/fi";
import { Link } from "react-router";
import AuthShell from "../components/auth/AuthShell";
import { PrimaryButton } from "../components/common/FormControls";
import { useAuth } from "../contexts/AuthContext";
import { getFriendlyError } from "../utils/errors";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(""); try { await forgotPassword(email); setMessage("Password reset instructions were sent. Check your inbox and spam folder."); } catch (nextError) { setError(getFriendlyError(nextError)); } finally { setLoading(false); } };
  return <AuthShell title="Reset your password" description="Enter your email and we’ll send a secure recovery link." footer={<Link to="/login" className="font-bold text-teal-400">Back to sign in</Link>}><form onSubmit={submit} className="space-y-4">{message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100">{message}</div>}{error && <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}<div><label className="mb-1.5 block text-xs font-semibold text-slate-300">Email</label><div className="relative"><FiMail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none focus:border-teal-400/60 focus:ring-4 focus:ring-teal-400/10" placeholder="you@example.com" /></div></div><PrimaryButton type="submit" loading={loading} className="h-12 w-full">Send reset link</PrimaryButton></form></AuthShell>;
}
