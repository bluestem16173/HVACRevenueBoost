"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import SmsConsentLeadForm from "@/components/SmsConsentLeadForm";
import { STICKY_CTA_DISMISS_STORAGE_KEY } from "@/hooks/useSmsConsentLeadForm";
import type { HomeServiceTrade } from "@/lib/homeservice/inferHomeServiceTrade";
import { shouldShowTradeStickyCta, stickyCtaTradeFromPathname } from "@/lib/should-show-trade-sticky-cta";
import type { SmsConsentSurface } from "@/lib/lead-consent";

const HTML_STICKY_CLASS = "hvacrb-sticky-lead-visible";

function stickyShellClass(trade: HomeServiceTrade, compact: boolean): string {
  const height = compact ? "max-h-[3.25rem]" : "max-h-[20vh]";
  const base = `fixed inset-x-0 bottom-0 z-50 flex min-h-0 flex-col ${height} overflow-hidden border-t shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-[max-height] duration-200 ease-out`;
  if (trade === "plumbing") return `${base} border-blue-200/90 bg-blue-50`;
  if (trade === "electrical") return `${base} border-amber-300/90 bg-amber-50`;
  return `${base} border-sky-200/90 bg-sky-100`;
}

function openFormButtonClass(trade: HomeServiceTrade): string {
  const base =
    "shrink-0 self-start rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow-lg ring-2 ring-white/40 transition hover:brightness-110 hover:ring-white/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 sm:self-auto sm:px-4 sm:py-2 sm:text-xs";
  if (trade === "plumbing") return `${base} bg-blue-900 hover:bg-blue-950`;
  if (trade === "electrical") return `${base} bg-amber-900 hover:bg-amber-950`;
  return `${base} bg-hvac-navy hover:bg-hvac-blue`;
}

function stickyCopy(trade: HomeServiceTrade): {
  regionAria: string;
  headline: string;
  serviceType: "hvac" | "rv_hvac" | "plumbing" | "electrical";
  consentSurface: SmsConsentSurface;
  issueSummary: string;
  submitButtonLabel: string;
  formAriaLabel: string;
} {
  if (trade === "plumbing") {
    return {
      regionAria: "Plumbing help — SMS request",
      headline: "Get a licensed plumber",
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
      headline: "Get a licensed electrician",
      serviceType: "electrical",
      consentSurface: "electrical",
      issueSummary: "Electrical service request (sticky CTA)",
      submitButtonLabel: "GET ELECTRICAL HELP NOW",
      formAriaLabel: "SMS electrical help request",
    };
  }
  return {
    regionAria: "HVAC help — SMS request",
    headline: "Get local HVAC help",
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
  /** After scroll, collapse height so the bar does not dominate the viewport; user can reopen. */
  const [compact, setCompact] = useState(false);
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

  useEffect(() => {
    setCompact(false);
  }, [pathname]);

  useEffect(() => {
    if (!shellReady || dismissed === true) return;
    const onScroll = () => {
      if (typeof window === "undefined") return;
      if (window.scrollY > 140) setCompact(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [shellReady, dismissed, pathname]);

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
    const offset = compact ? "3.5rem" : "min(21vh, 8.75rem)";
    document.documentElement.style.setProperty("--hvacrb-sticky-call-offset", offset);
    return () => {
      document.documentElement.classList.remove(HTML_STICKY_CLASS);
      document.documentElement.style.setProperty("--hvacrb-sticky-call-offset", "0px");
    };
  }, [showBar, compact]);

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
    <div
      className={`${stickyShellClass(trade, compact)} ${compact ? "" : "ring-2 ring-slate-900/10 ring-offset-0"}`}
      role="region"
      aria-label={copy.regionAria}
    >
      <div className="relative mx-auto min-h-0 max-w-5xl flex-1 overflow-y-auto overscroll-y-contain px-3 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-600 shadow-md transition hover:border-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 active:scale-95 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-red-500 dark:hover:bg-red-600 dark:hover:text-white"
          aria-label="Dismiss SMS request form"
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-1 flex max-w-[calc(100%-3.25rem)] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="truncate text-[10px] font-black uppercase tracking-wide text-slate-900 sm:text-xs">{copy.headline}</p>
          {compact ? (
            <button
              type="button"
              className={openFormButtonClass(trade)}
              onClick={() => setCompact(false)}
            >
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0 opacity-95" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
                Open form
              </span>
            </button>
          ) : null}
        </div>

        {!compact ? (
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
        ) : null}
      </div>
    </div>
  );
}
