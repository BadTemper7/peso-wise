import React from "react";
import Logo from "../../assets/logo.webp";

export default function LoadingScreen({ label = "Loading PesoWise…", compact = false }) {
  if (compact) return <div className="flex min-h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-500 dark:border-slate-700 dark:border-t-teal-400" /></div>;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-6 dark:bg-[#07111f]">
      <div className="text-center">
        <img src={Logo} alt="PesoWise" className="mx-auto h-16 w-16 animate-pulse rounded-2xl object-contain" />
        <div className="mx-auto mt-5 h-1.5 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-teal-500" /></div>
        <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}
