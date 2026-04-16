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

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STICKY_CTA_DISMISS_STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const hideChrome = dismissed === true || !shouldShowHvacStickyCta(pathname);

  useLayoutEffect(() => {
    if (hideChrome) {
      document.documentElement.classList.remove(HTML_STICKY_CLASS);
      document.documentElement.style.setProperty("--hvacrb-sticky-call-offset", "0px");
      return;
    }
    document.documentElement.classList.add(HTML_STICKY_CLASS);
    document.documentElement.style.setProperty("--hvacrb-sticky-call-offset", "min(28vh,11rem)");
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
      className="fixed inset-x-0 bottom-0 z-[55] max-h-[min(30vh,20rem)] overflow-y-auto border-t border-slate-700 bg-slate-950 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] md:max-h-[min(30vh,18rem)]"
      role="region"
      aria-label="Find local HVAC service — SMS request"
    >
      <div className="relative mx-auto max-w-5xl px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 sm:px-4">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-hvac-gold"
          aria-label="Dismiss quick request form"
        >
          <span className="text-lg leading-none" aria-hidden>
            ×
          </span>
        </button>

        <div className="mb-2 max-w-[calc(100%-2.5rem)] space-y-0.5">
          <p className="text-sm font-black uppercase tracking-wide text-white">Find local HVAC service</p>
          <p className="text-[11px] font-medium leading-snug text-slate-400">
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
        />
      </div>
    </div>
  );
}
