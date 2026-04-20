"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import SmsConsentLeadForm from "@/components/SmsConsentLeadForm";
import { STICKY_CTA_DISMISS_STORAGE_KEY } from "@/hooks/useSmsConsentLeadForm";
import type { HomeServiceTrade } from "@/lib/homeservice/inferHomeServiceTrade";
import { shouldShowTradeStickyCta, stickyCtaTradeFromPathname } from "@/lib/should-show-trade-sticky-cta";
import type { SmsConsentSurface } from "@/lib/lead-consent";

const HTML_STICKY_CLASS = "hvacrb-sticky-lead-visible";

function stickyShellClass(trade: HomeServiceTrade): string {
  const base =
    "fixed inset-x-0 bottom-0 z-50 max-h-[min(46vh,24rem)] overflow-y-auto border-t shadow-[0_-8px_30px_rgba(0,0,0,0.12)]";
  if (trade === "plumbing") return `${base} border-blue-200/90 bg-blue-50`;
  if (trade === "electrical") return `${base} border-amber-300/90 bg-amber-50`;
  return `${base} border-sky-200/90 bg-sky-100`;
}

function stickyCopy(trade: HomeServiceTrade): {
  regionAria: string;
  headline: string;
  sub: string;
  serviceType: "hvac" | "rv_hvac" | "plumbing" | "electrical";
  consentSurface: SmsConsentSurface;
  issueSummary: string;
  submitButtonLabel: string;
  formAriaLabel: string;
} {
  if (trade === "plumbing") {
    return {
      regionAria: "Plumbing help — SMS request",
      headline: "Urgent: get a licensed plumber",
      sub: "Same-day dispatch is often available. SMS follow-up about your plumbing inquiry, scheduling, and service updates (consent required below).",
      serviceType: "plumbing",
      consentSurface: "plumbing",
      issueSummary: "Plumbing service request (sticky CTA)",
      submitButtonLabel: "GET PLUMBING HELP NOW",
      formAriaLabel: "SMS plumbing help request",
    };
  }
  if (trade === "electrical") {
    return {
      regionAria: "Electrical help — SMS request",
      headline: "Urgent: get a licensed electrician",
      sub: "Electrical faults can worsen fast. SMS follow-up about your electrical inquiry, scheduling, and service updates (consent required below).",
      serviceType: "electrical",
      consentSurface: "electrical",
      issueSummary: "Electrical service request (sticky CTA)",
      submitButtonLabel: "GET ELECTRICAL HELP NOW",
      formAriaLabel: "SMS electrical help request",
    };
  }
  return {
    regionAria: "HVAC help — SMS request",
    headline: "Urgent: get local HVAC help",
    sub: "SMS follow-up about your HVAC inquiry, scheduling, and service updates (consent required below).",
    serviceType: "hvac",
    consentSurface: "hvac",
    issueSummary: "HVAC service request (sticky CTA)",
    submitButtonLabel: "GET HVAC HELP NOW",
    formAriaLabel: "SMS HVAC help request",
  };
}

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

  const showBar = shellReady && dismissed !== true && shouldShowTradeStickyCta(pathname);
  const trade = useMemo(() => stickyCtaTradeFromPathname(pathname), [pathname]);
  const copy = useMemo(() => stickyCopy(trade), [trade]);

  useLayoutEffect(() => {
    if (!showBar) {
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
  }, [showBar]);

  if (!showBar) {
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
    <div className={stickyShellClass(trade)} role="region" aria-label={copy.regionAria}>
      <div className="relative mx-auto max-w-5xl px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 sm:px-4">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-white/60 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Dismiss SMS request form"
        >
          <span className="text-lg leading-none font-light" aria-hidden>
            ×
          </span>
        </button>

        <div className="mb-2 max-w-[calc(100%-2.5rem)] space-y-1">
          <p className="text-sm font-black uppercase tracking-wide text-slate-900">{copy.headline}</p>
          <p className="text-[11px] font-medium leading-snug text-slate-900">{copy.sub}</p>
        </div>

        <SmsConsentLeadForm
          variant="sticky"
          defaultSourcePage="/"
          phoneFieldId="sticky-sms-lead-phone"
          showNameField={false}
          serviceType={copy.serviceType}
          consentSurface={copy.consentSurface}
          issueSummary={copy.issueSummary}
          submitButtonLabel={copy.submitButtonLabel}
          formAriaLabel={copy.formAriaLabel}
        />
      </div>
    </div>
  );
}
