"use client";

import Script from "next/script";
import { useEffect } from "react";
import { fireGoogleAdsConversion, getGoogleAdsAwId } from "@/lib/gtag-google-ads";

/**
 * Injects the global gtag snippet when `NEXT_PUBLIC_GOOGLE_ADS_ID` (or derivable AW id from `send_to`) is set,
 * and fires {@link fireGoogleAdsConversion} on `tel:` link clicks (capture phase).
 */
export default function GoogleAdsGtagRoot() {
  const awId = getGoogleAdsAwId();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const onPointerDown = (ev: MouseEvent) => {
      const el = ev.target;
      if (!(el instanceof Element)) return;
      const a = el.closest("a[href]");
      if (!a || !(a instanceof HTMLAnchorElement)) return;
      const href = (a.getAttribute("href") || "").trim().toLowerCase();
      if (!href.startsWith("tel:")) return;
      fireGoogleAdsConversion();
    };

    document.addEventListener("click", onPointerDown, true);
    return () => document.removeEventListener("click", onPointerDown, true);
  }, []);

  if (!awId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(awId)}`} strategy="afterInteractive" />
      <Script id="google-ads-gtag-inline" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(awId)});`}
      </Script>
    </>
  );
}
