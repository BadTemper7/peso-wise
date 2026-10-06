import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const PWAContext = createContext(null);

const getPlatform = () => {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  const isiPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/i.test(ua) || isiPadOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
};

const getStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator?.standalone === true
  );
};

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(getStandalone);
  const platform = useMemo(getPlatform, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    const media = window.matchMedia?.("(display-mode: standalone)");
    const handleDisplayModeChange = () => setIsInstalled(getStandalone());

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    media?.addEventListener?.("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      media?.removeEventListener?.("change", handleDisplayModeChange);
    };
  }, []);

  const requestInstall = useCallback(async () => {
    if (isInstalled) return { status: "installed" };
    if (!deferredPrompt) return { status: "manual" };

    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice?.outcome === "accepted") {
        setIsInstalled(true);
        return { status: "accepted" };
      }
      return { status: "dismissed" };
    } catch {
      setDeferredPrompt(null);
      return { status: "manual" };
    }
  }, [deferredPrompt, isInstalled]);

  const value = useMemo(
    () => ({
      canPromptInstall: Boolean(deferredPrompt),
      isInstalled,
      platform,
      requestInstall,
    }),
    [deferredPrompt, isInstalled, platform, requestInstall],
  );

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) throw new Error("usePWA must be used inside PWAProvider");
  return context;
}
