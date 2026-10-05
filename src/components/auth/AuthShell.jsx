import React from "react";
import { Link } from "react-router";
import Logo from "../../assets/logo.webp";

export default function AuthShell({ title, description, children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07111f] px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/15 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-amber-300" />
          <div className="p-7 sm:p-9">
            <div className="mb-7 text-center">
              <Link to="/" className="inline-flex"><img src={Logo} alt="PesoWise" className="h-16 w-16 rounded-2xl object-contain shadow-lg shadow-teal-500/15" /></Link>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </div>
            {children}
            {footer && <div className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-slate-400">{footer}</div>}
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-slate-600">© {new Date().getFullYear()} PesoWise · Personal and shared budgets</p>
      </div>
    </div>
  );
}
