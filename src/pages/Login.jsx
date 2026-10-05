import React, { useState } from "react";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router";
import AuthShell from "../components/auth/AuthShell";
import { PrimaryButton } from "../components/common/FormControls";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getFriendlyError } from "../utils/errors";

const authInput = "h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-teal-400/10";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back to PesoWise.");
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (nextError) {
      setError(getFriendlyError(nextError));
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Welcome back" description="Sign in to continue managing your personal and shared budgets." footer={<>New to PesoWise? <Link to="/register" className="font-bold text-teal-400 hover:text-teal-300">Create an account</Link></>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
        <div><label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-300">Email</label><div className="relative"><FiMail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id="email" name="email" type="email" autoComplete="email" required autoFocus value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} placeholder="you@example.com" className={authInput} /></div></div>
        <div><div className="mb-1.5 flex items-center justify-between"><label htmlFor="password" className="text-xs font-semibold text-slate-300">Password</label><Link to="/forgot-password" className="text-xs font-semibold text-teal-400 hover:text-teal-300">Forgot password?</Link></div><div className="relative"><FiLock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} placeholder="Enter your password" className={`${authInput} pr-12`} /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}</button></div></div>
        <PrimaryButton type="submit" loading={loading} className="mt-2 h-12 w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/15 hover:brightness-105">Sign in</PrimaryButton>
      </form>
    </AuthShell>
  );
}
