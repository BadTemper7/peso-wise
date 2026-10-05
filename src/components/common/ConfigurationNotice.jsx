import React from "react";
import { FiAlertTriangle, FiCode } from "react-icons/fi";
import Logo from "../../assets/logo.webp";

export default function ConfigurationNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-5 dark:bg-[#07111f]">
      <div className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-7 shadow-xl dark:border-amber-400/20 dark:bg-[#0d1a2b] sm:p-9">
        <img src={Logo} alt="PesoWise" className="h-14 w-14 rounded-2xl object-contain" />
        <div className="mt-6 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300"><FiAlertTriangle className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-bold text-slate-950 dark:text-white">Connect your Supabase project</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Copy <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-white/10">.env.example</code> to <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-white/10">.env</code>, then add your project URL and public anon key.</p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-200"><FiCode className="mb-2 h-4 w-4 text-teal-400" />VITE_SUPABASE_URL=https://your-project.supabase.co<br />VITE_SUPABASE_ANON_KEY=your-anon-key<br />VITE_APP_URL=http://localhost:5173</div>
        <p className="mt-5 text-xs leading-5 text-slate-400">Run the migration in <code>supabase/migrations/001_initial_schema.sql</code> before using the app. Never place a service-role key in the frontend.</p>
      </div>
    </div>
  );
}
