"use client";

import { useEffect, useState } from "react";
import { PWAInstallButton } from "@/shared/components/PWAInstallButton";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PWAInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsStandalone(standalone);
    setIsDismissed(localStorage.getItem("wedupay-install-dismissed") === "true");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!promptEvent || isStandalone || isDismissed) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem("wedupay-install-dismissed", "true");
    setIsDismissed(true);
  };

  return (
    <div className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl shadow-slate-900/15 backdrop-blur dark:border-primary/20 dark:bg-background-dark/95 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-background-dark">
          <span className="material-symbols-outlined text-xl">install_mobile</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900 dark:text-white">Install WeduPay</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Use it like a mobile app.</p>
        </div>
        <PWAInstallButton compact className="flex size-10 items-center justify-center rounded-xl bg-primary text-background-dark" />
        <button
          type="button"
          onClick={dismiss}
          className="flex size-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-primary/10"
          aria-label="Dismiss install prompt"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
}
