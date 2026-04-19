"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SmsConsentLeadForm from "@/components/SmsConsentLeadForm";
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
      "min(42vh, 22rem)"
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
      className="fixed inset-x-0 bottom-0 z-50 max-h-[min(46vh,24rem)] overflow-y-auto border-t border-sky-200/90 bg-sky-100 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
      role="region"
      aria-label="Find local RV HVAC service — SMS request"
    >
      <div className="relative mx-auto max-w-5xl px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 sm:px-4">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-sky-200/80 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Dismiss SMS request form"
        >
          <span className="text-lg leading-none font-light" aria-hidden>
            ×
          </span>
        </button>

        <div className="mb-2 max-w-[calc(100%-2.5rem)] space-y-1">
          <p className="text-sm font-black uppercase tracking-wide text-slate-900">
            Find local RV HVAC service
          </p>
          <p className="text-[11px] font-medium leading-snug text-slate-900">
            Request SMS follow-up about your inquiry, scheduling, and service updates (consent required below).
          </p>
        </div>

        <SmsConsentLeadForm
          variant="sticky"
          defaultSourcePage="/"
          phoneFieldId="sticky-sms-lead-phone"
          showNameField={false}
          serviceType="hvac"
          issueSummary="HVAC service request (sticky CTA)"
          submitButtonLabel="GET HELP NOW"
        />
      </div>
    </div>
  );
}
