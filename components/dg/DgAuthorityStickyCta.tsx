"use client";

import { SmsLegalFooterLinks } from "@/components/SmsLegalFooterLinks";
import { useEffect, useState } from "react";
import type { Trade } from "@/lib/dg/resolveCTA";

type Props = {
  title: string;
  body: string;
  button: string;
  leadIssue: string;
  leadLocation?: string;
  leadTrade?: Trade;
  /** Scroll progress (0–1) past which the bar appears. */
  showAfterProgress?: number;
};

/**
 * Mobile-first fixed CTA: appears once the reader has scrolled deep enough
 * (trade + severity copy computed on the server and passed in).
 */
export function DgAuthorityStickyCta({
  title,
  body,
  button,
  leadIssue,
  leadLocation,
  leadTrade,
  showAfterProgress = 0.2,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const maxScroll = el.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 1;
      setVisible(progress >= showAfterProgress);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [showAfterProgress]);

  if (!visible) return null;

  return (
    <div className="dg-sticky-cta md:hidden" role="region" aria-label="Diagnostic help">
      <div className="dg-sticky-cta__inner">
        <div className="dg-sticky-cta__text">
          <p className="dg-sticky-cta__title">{title}</p>
          <p className="dg-sticky-cta__body">{body}</p>
        </div>
        <button
          type="button"
          className="dg-sticky-cta__btn"
          data-open-lead-modal
          data-lead-issue={leadIssue || undefined}
          data-lead-location={leadLocation?.trim() || undefined}
          data-lead-trade={leadTrade}
        >
          {button}
        </button>
        <SmsLegalFooterLinks className="mt-2 w-full justify-center text-[9px]" tone="onDark" />
      </div>
    </div>
  );
}
