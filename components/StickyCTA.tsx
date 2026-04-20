"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { inferHomeServiceTradeFromPathname } from "@/lib/homeservice/inferHomeServiceTrade";

export function StickyCTA() {
  const pathname = usePathname();
  const trade = useMemo(() => inferHomeServiceTradeFromPathname(pathname), [pathname]);
  const { line, btn } =
    trade === "plumbing"
      ? { line: "Leak, backup, or no hot water? Urgent help available.", btn: "Get plumbing help" }
      : trade === "electrical"
        ? { line: "Breaker, power loss, or buzzing? Do not wait on electrical risk.", btn: "Get electrical help" }
        : { line: "Need a licensed HVAC tech? Same-day dispatch often available.", btn: "Get HVAC help" };

  return (
    <div className="sticky top-0 z-[60] border-b border-slate-200 bg-white/95 py-2 text-center text-xs text-slate-600 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-300">
      <span className="font-medium">{line}</span>{" "}
      <button
        type="button"
        onClick={() => {
          if (typeof window === "undefined") return;
          if (trade === "plumbing" || trade === "electrical") {
            window.dispatchEvent(new CustomEvent("open-leadcard", { detail: { issue: "not_sure" } }));
          } else {
            window.dispatchEvent(new CustomEvent("open-leadcard"));
          }
        }}
        className="ml-2 inline-flex items-center rounded-md border border-hvac-navy bg-hvac-navy px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-hvac-blue focus:outline-none focus:ring-2 focus:ring-hvac-gold dark:border-hvac-gold dark:bg-hvac-navy"
      >
        {btn}
      </button>
    </div>
  );
}
