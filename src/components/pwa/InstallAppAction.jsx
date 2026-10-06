import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  FiCheckCircle,
  FiDownload,
  FiMoreVertical,
  FiShare,
  FiSmartphone,
} from "react-icons/fi";
import Modal from "../common/Modal";
import { usePWA } from "../../contexts/PWAContext";

function InstallGuide({ platform }) {
  if (platform === "ios") {
    return (
      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <p className="leading-6">
          iPhone and iPad install PesoWise through the browser's Home Screen option.
        </p>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">1</span>
            <span className="pt-1">Tap the <strong>Share</strong> button <FiShare className="ml-1 inline" /> in your browser.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">2</span>
            <span className="pt-1">Choose <strong>Add to Home Screen</strong>.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">3</span>
            <span className="pt-1">Tap <strong>Add</strong>. PesoWise will open like an app from your Home Screen.</span>
          </li>
        </ol>
      </div>
    );
  }

  if (platform === "android") {
    return (
      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <p className="leading-6">
          Your browser did not show the automatic install prompt. You can still add PesoWise manually.
        </p>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">1</span>
            <span className="pt-1">Open your browser menu <FiMoreVertical className="ml-1 inline" />.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">2</span>
            <span className="pt-1">Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">3</span>
            <span className="pt-1">Confirm the install.</span>
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
      <p>
        Open your browser menu and choose <strong>Install PesoWise</strong>, <strong>Install app</strong>, or <strong>Add to Home screen</strong>.
      </p>
      <p className="text-xs text-slate-400">
        The exact wording depends on the browser you are using.
      </p>
    </div>
  );
}

export default function InstallAppAction({ variant = "menu", className = "", hideWhenInstalled = false }) {
  const { canPromptInstall, isInstalled, platform, requestInstall } = usePWA();
  const [guideOpen, setGuideOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (isInstalled && hideWhenInstalled) return null;

  const handleInstall = async () => {
    if (isInstalled) return;
    setInstalling(true);
    const result = await requestInstall();
    setInstalling(false);
    if (result.status === "manual") setGuideOpen(true);
  };

  const buttonLabel = isInstalled
    ? "Installed"
    : installing
      ? "Opening install…"
      : canPromptInstall
        ? "Install PesoWise"
        : "Add to Home Screen";

  const icon = isInstalled ? <FiCheckCircle className="h-[19px] w-[19px]" /> : <FiDownload className="h-[19px] w-[19px]" />;

  return (
    <>
      {variant === "card" ? (
        <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d1a2b] ${className}`}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
              <FiSmartphone className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Install PesoWise</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Add PesoWise to your iPhone, iPad, or Android Home Screen for faster access and an app-like full-screen view.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            disabled={isInstalled || installing}
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 text-xs font-bold text-white transition hover:bg-teal-600 disabled:cursor-default disabled:bg-teal-500/55 dark:bg-teal-400 dark:text-[#062019] dark:hover:bg-teal-300"
          >
            {icon}
            {buttonLabel}
          </button>
        </section>
      ) : (
        <button
          type="button"
          onClick={handleInstall}
          disabled={isInstalled || installing}
          className={`flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-teal-200 hover:bg-teal-50/60 disabled:cursor-default dark:border-slate-700 dark:bg-white/[0.025] dark:hover:border-teal-400/20 dark:hover:bg-teal-400/[0.05] ${className}`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900 dark:text-white">{buttonLabel}</span>
            <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">
              {isInstalled ? "PesoWise is already installed on this device" : "Use PesoWise like an app from your Home Screen"}
            </span>
          </span>
        </button>
      )}

      {guideOpen && createPortal(
        <Modal
          open
          onClose={() => setGuideOpen(false)}
          title="Add PesoWise to your Home Screen"
          description={platform === "ios" ? "iPhone / iPad" : platform === "android" ? "Android" : "Install instructions"}
          maxWidth="max-w-md"
        >
          <InstallGuide platform={platform} />
        </Modal>,
        document.body,
      )}
    </>
  );
}
