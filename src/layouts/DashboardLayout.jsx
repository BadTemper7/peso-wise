import React, { useEffect, useState } from "react";
import { Outlet } from "react-router";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

const getInitialTheme = () => {
  const saved = window.localStorage.getItem("pesowise-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("pesowise-theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 transition-colors dark:bg-[#07111f] dark:text-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <button type="button" aria-label="Close sidebar" className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="min-h-screen lg:pl-[270px]">
        <Topbar onMenuClick={() => setSidebarOpen(true)} theme={theme} onThemeToggle={() => setTheme((current) => current === "dark" ? "light" : "dark")} />
        <main className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8"><div className="mx-auto w-full max-w-[1500px]"><Outlet /></div></main>
      </div>
    </div>
  );
}
