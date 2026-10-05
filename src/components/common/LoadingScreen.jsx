import React from "react";
import Logo from "../../assets/logo.webp";

export default function LoadingScreen({ label = "Loading PesoWise…" }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-6 dark:bg-[#07111f]">
      <div className="text-center" role="status" aria-live="polite">
        <img src={Logo} alt="PesoWise" className="mx-auto h-16 w-16 rounded-2xl object-contain shadow-sm" />
        <div className="mx-auto mt-5 h-1.5 w-36 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="loading-bar h-full w-1/2 rounded-full bg-teal-500" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}
