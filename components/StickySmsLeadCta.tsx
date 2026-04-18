"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { STICKY_CTA_DISMISS_STORAGE_KEY } from "@/hooks/useSmsConsentLeadForm";
import { shouldShowHvacStickyCta } from "@/lib/should-show-hvac-sticky-cta";

const HTML_STICKY_CLASS = "hvacrb-sticky-lead-visible";

export default function StickySmsLeadCta() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  /** Avoid SSR vs client mismatch: `usePathname()` + `localStorage` differ until the client mounts. */
  const [shellReady, setShellReady] = useState(false);

  useEffect(() => {
    setShellReady(true);
    try {
      setDismissed(localStorage.getItem(STICKY_CTA_DISMISS_STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const hideChrome =
    !shellReady || dismissed === true || !shouldShowHvacStickyCta(pathname);

  useLayoutEffect(() => {
    if (hideChrome) {
      document.documentElement.classList.remove(HTML_STICKY_CLASS);
      document.documentElement.style.setProperty("--hvacrb-sticky-call-offset", "0px");
      return;
    }
    document.documentElement.classList.add(HTML_STICKY_CLASS);
    document.documentElement.style.setProperty(
      "--hvacrb-sticky-call-offset",
      "calc(4.25rem + env(safe-area-inset-bottom, 0px))"
    );
    return () => {
      document.documentElement.classList.remove(HTML_STICKY_CLASS);
      document.documentElement.style.setProperty("--hvacrb-sticky-call-offset", "0px");
    };
  }, [hideChrome]);

  if (hideChrome) {
    return null;
  }

  const dismiss = () => {
    try {
      localStorage.setItem(STICKY_CTA_DISMISS_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white p-3 shadow-lg"
      role="region"
      aria-label="HVAC help — open request form"
    >
      <div className="relative mx-auto flex max-w-4xl flex-col items-stretch gap-2 pr-10 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pr-12">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-0 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-600"
          aria-label="Dismiss HVAC help bar"
        >
          <span className="text-lg leading-none" aria-hidden>
            ×
          </span>
        </button>

        <p className="min-w-0 text-sm font-semibold leading-snug text-red-600">
          <span aria-hidden>⚠️ </span>
          AC not cooling? Don&apos;t risk a $3,000 repair.
        </p>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("open-leadcard"));
            }
          }}
          className="shrink-0 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
        >
          Get HVAC Help Now
        </button>
      </div>
    </div>
  );
}
