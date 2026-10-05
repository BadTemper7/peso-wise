import React, { useState } from "react";
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from "react-icons/fi";
import { Link } from "react-router";
import AuthShell from "../components/auth/AuthShell";
import { LoadingDots } from "../components/common/FormControls";
import { useAuth } from "../contexts/AuthContext";
import { getFriendlyError } from "../utils/errors";

const authInput = "h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-teal-400/10";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Use at least 8 characters for your password.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const result = await register(form);
      setSuccess(true);
      if (result.session) window.location.assign("/onboarding");
    } catch (nextError) { setError(getFriendlyError(nextError)); }
    finally { setLoading(false); }
  };

  if (success) return <AuthShell title="Check your email" description="We sent a verification link to your email address. Open it to activate your account and create your first workspace." footer={<Link to="/login" className="font-bold text-teal-400 hover:text-teal-300">Back to sign in</Link>}><div className="rounded-2xl border border-teal-400/20 bg-teal-400/10 p-5 text-center text-sm leading-6 text-teal-100">The verification link will return you to PesoWise using the configured <code className="rounded bg-black/20 px-1">VITE_APP_URL</code>.</div></AuthShell>;

  return (
    <AuthShell title="Create your account" description="Use your own secure login, then create or join shared budget workspaces." footer={<>Already have an account? <Link to="/login" className="font-bold text-teal-400 hover:text-teal-300">Sign in</Link></>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
        <div><label className="mb-1.5 block text-xs font-semibold text-slate-300">Full name</label><div className="relative"><FiUser className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input required autoComplete="name" value={form.fullName} onChange={(e) => setForm((v) => ({ ...v, fullName: e.target.value }))} placeholder="Juan Dela Cruz" className={authInput} /></div></div>
        <div><label className="mb-1.5 block text-xs font-semibold text-slate-300">Email</label><div className="relative"><FiMail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} placeholder="you@example.com" className={authInput} /></div></div>
        <div><label className="mb-1.5 block text-xs font-semibold text-slate-300">Password</label><div className="relative"><FiLock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} placeholder="At least 8 characters" className={`${authInput} pr-12`} /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white">{showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}</button></div></div>
        <div><label className="mb-1.5 block text-xs font-semibold text-slate-300">Confirm password</label><div className="relative"><FiLock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm((v) => ({ ...v, confirmPassword: e.target.value }))} placeholder="Repeat your password" className={authInput} /></div></div>
        <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-sm font-bold text-slate-950 transition hover:brightness-105 disabled:opacity-60">{loading && <LoadingDots />}{loading ? "Creating account…" : "Create account"}</button>
      </form>
    </AuthShell>
  );
}
