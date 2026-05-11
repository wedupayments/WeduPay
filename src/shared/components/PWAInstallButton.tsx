"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

interface PWAInstallButtonProps {
  className?: string;
  compact?: boolean;
}

export function PWAInstallButton({ className = "", compact = false }: PWAInstallButtonProps) {
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [needsManualInstall, setNeedsManualInstall] = useState(false);

  useEffect(() => {
    const update = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(userAgent);
      const isMobile = /android|iphone|ipad|ipod/.test(userAgent);

      setIsStandalone(standalone);
      setCanInstall(Boolean(deferredPrompt));
      setNeedsManualInstall(isMobile && isIos && !standalone && !deferredPrompt);
    };

    update();
    listeners.add(update);

    return () => {
      listeners.delete(update);
    };
  }, []);

  if (isStandalone || (!canInstall && !needsManualInstall)) {
    return null;
  }

  const install = async () => {
    if (!deferredPrompt) {
      window.alert("To install WeduPay on iPhone, tap Share, then Add to Home Screen.");
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    notifyListeners();
  };

  return (
    <button
      type="button"
      onClick={install}
      className={
        className ||
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-background-dark shadow-lg shadow-primary/20 transition hover:brightness-110"
      }
      aria-label="Install WeduPay app"
    >
      <span className="material-symbols-outlined text-xl">install_mobile</span>
      {!compact && <span>Install App</span>}
    </button>
  );
}
