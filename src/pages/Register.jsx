import React, { useState } from "react";
import { FiEye, FiEyeOff, FiLock, FiMail, FiPlusCircle, FiUser, FiUsers } from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router";
import AuthShell from "../components/auth/AuthShell";
import { PrimaryButton } from "../components/common/FormControls";
import { useAuth } from "../contexts/AuthContext";
import { getFriendlyError } from "../utils/errors";

const authInput = "h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-teal-400/10";
const intentKey = (email) => `pesowise-onboarding-intent:${email.trim().toLowerCase()}`;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitedEmail = searchParams.get("email") || "";
  const initialIntent = searchParams.get("mode") === "join" || invitedEmail ? "join" : "create";
  const [form, setForm] = useState({
    fullName: "",
    email: invitedEmail,
    password: "",
    confirmPassword: "",
    onboardingIntent: initialIntent,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.onboardingIntent) return setError("Choose whether you want to create or join a budget.");
    if (form.password.length < 8) return setError("Use at least 8 characters for your password.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const result = await register(form);
      window.localStorage.setItem(intentKey(form.email), form.onboardingIntent);
      setSuccess(true);
      if (result.session) navigate(`/onboarding?mode=${form.onboardingIntent}`, { replace: true });
    } catch (nextError) {
      setError(getFriendlyError(nextError));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const joining = form.onboardingIntent === "join";
    return (
      <AuthShell
        title="Check your email"
        description={`We sent a verification link to your email address. Open it to activate your account and ${joining ? "accept your budget invitation" : "create your budget"}.`}
        footer={<Link to="/login" state={form.onboardingIntent === "join" ? { from: "/invitations" } : undefined} className="font-bold text-teal-400 hover:text-teal-300">Back to sign in</Link>}
      >
        <div className="rounded-2xl border border-teal-400/20 bg-teal-400/10 p-5 text-center text-sm leading-6 text-teal-100">
          The verification link will return you to PesoWise using the configured <code className="rounded bg-black/20 px-1">VITE_APP_URL</code>.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      description="Use your own secure login, then create a budget or join one you were invited to."
      footer={<>Already have an account? <Link to="/login" state={form.onboardingIntent === "join" ? { from: "/invitations" } : undefined} className="font-bold text-teal-400 hover:text-teal-300">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

        <fieldset>
          <legend className="mb-2 block text-xs font-semibold text-slate-300">How would you like to start?</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "create", label: "Create a Budget", description: "Start a new personal or shared budget.", icon: FiPlusCircle },
              { value: "join", label: "Join a Budget", description: "Accept an invitation sent to this email.", icon: FiUsers },
            ].map(({ value, label, description, icon: Icon }) => {
              const selected = form.onboardingIntent === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setForm((current) => ({ ...current, onboardingIntent: value }))}
                  className={`flex min-h-[108px] flex-col items-start justify-center rounded-2xl border p-3 text-left transition ${
                    selected
                      ? "border-teal-400/70 bg-teal-400/12 ring-2 ring-teal-400/15"
                      : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${selected ? "bg-teal-500 text-white" : "bg-white/[0.06] text-slate-400"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="mt-2 text-xs font-bold text-white">{label}</span>
                  <span className="mt-1 text-[10px] leading-4 text-slate-400">{description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-300">Full name</label>
          <div className="relative">
            <FiUser className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input required autoComplete="name" value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} placeholder="Juan Dela Cruz" className={authInput} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-300">Email</label>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} placeholder="you@example.com" className={authInput} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-300">Password</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} placeholder="At least 8 characters" className={`${authInput} pr-12`} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-300">Confirm password</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm((value) => ({ ...value, confirmPassword: event.target.value }))} placeholder="Repeat your password" className={authInput} />
          </div>
        </div>
        <PrimaryButton type="submit" loading={loading} className="h-12 w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/15 hover:brightness-105">Create account</PrimaryButton>
      </form>
    </AuthShell>
  );
}
