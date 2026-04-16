"use client";

import { useCallback, useEffect, useState } from "react";
import LeadCard from "./LeadCard";

/** Map URL path to LeadCard `issue` for pages that never dispatch explicit detail. */
function inferLeadIssueFromPathname(pathname: string): string {
  const p = pathname.toLowerCase();
  if (p.includes("ac-blowing-warm-air") || p.includes("blowing-warm-air")) return "blowing_warm";
  if (p.includes("ac-not-turning-on") || p.includes("not-turning-on")) return "wont_turn_on";
  if (p.includes("ac-not-cooling") || p.includes("/not-cooling")) return "no_cooling";
  if (p.includes("noise") || p.includes("buzzing") || p.includes("grinding") || p.includes("loud-humming"))
    return "weird_noises";
  return "wont_turn_on";
}

export default function DiagnosticModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [leadIssue, setLeadIssue] = useState("wont_turn_on");
  const [formMountKey, setFormMountKey] = useState(0);

  const openFromEvent = useCallback((e: Event) => {
    let issueFromDetail: string | undefined;
    const ce = e as CustomEvent<{ issue?: string }>;
    if (ce.detail && typeof ce.detail.issue === "string" && ce.detail.issue.trim()) {
      issueFromDetail = ce.detail.issue.trim();
    }
    const next =
      issueFromDetail ??
      (typeof window !== "undefined" ? inferLeadIssueFromPathname(window.location.pathname) : "wont_turn_on");
    setLeadIssue(next);
    setFormMountKey((k) => k + 1);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const w = window as Window & {
      openLeadCard?: (issue?: string) => void;
      openHvacServiceModal?: () => void;
    };

    // Legacy static HTML (authority templates, DB `content_html`) calls these from inline `onclick`.
    // Scripts inside `dangerouslySetInnerHTML` do not run in React, so we register globals here.
    w.openLeadCard = (issue?: string) => {
      if (issue && String(issue).trim()) {
        window.dispatchEvent(new CustomEvent("open-leadcard", { detail: { issue: String(issue).trim() } }));
      } else {
        window.dispatchEvent(new CustomEvent("open-leadcard"));
      }
    };
    w.openHvacServiceModal = () => {
      window.dispatchEvent(new CustomEvent("open-leadcard"));
    };

    const handler = (ev: Event) => openFromEvent(ev);
    window.addEventListener("open-leadcard", handler);
    return () => {
      window.removeEventListener("open-leadcard", handler);
      if (w.openLeadCard) delete w.openLeadCard;
      if (w.openHvacServiceModal) delete w.openHvacServiceModal;
    };
  }, [openFromEvent]);

  useEffect(() => {
    let shown = false;

    const open = () => {
      if (shown) return;
      shown = true;
      window.dispatchEvent(new CustomEvent("open-leadcard"));
    };

    const timer = setTimeout(open, 8000);

    const scrollHandler = () => {
      if (window.scrollY > 600) open();
    };

    window.addEventListener("scroll", scrollHandler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", scrollHandler);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10050] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Request HVAC service"
    >
      <div className="relative w-full max-w-[460px] sm:scale-95 animate-in fade-in zoom-in duration-200">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute z-[10060] -top-3 -right-3 sm:-top-4 sm:-right-4 w-11 h-11 sm:w-12 sm:h-12 bg-white text-slate-900 rounded-full shadow-xl border-2 border-slate-800 flex items-center justify-center hover:bg-slate-100 hover:text-red-600 text-2xl sm:text-3xl font-black transition-transform hover:scale-110"
          aria-label="Close"
        >
          &times;
        </button>

        <div className="max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl overscroll-contain">
          <LeadCard key={formMountKey} serviceType="ac" issue={leadIssue} />
          <p className="text-center text-xs text-slate-300 mt-3 px-2 pb-2">
            <a href="/request-service" className="underline hover:text-white">
              Open the same form without this popup
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
