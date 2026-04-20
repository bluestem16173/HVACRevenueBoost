"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { SmsLegalFooterLinks } from "@/components/SmsLegalFooterLinks";
import { inferHomeServiceTradeFromPathname } from "@/lib/homeservice/inferHomeServiceTrade";

type Level = "high" | "medium" | "final";

type Row = { text: string; button: string; issue: string };

const HVAC: Record<Level, Row> = {
  high: {
    text: "At this point, every extra hour of runtime increases the risk of a $1,500–$3,500 repair.",
    button: "Urgent: get HVAC help now",
    issue: "no_cooling",
  },
  medium: {
    text: "If basic checks did not fix it, the issue is no longer safe to ignore.",
    button: "Urgent: check HVAC availability",
    issue: "not_sure",
  },
  final: {
    text: "Stop running the equipment before this becomes a major repair or safety issue.",
    button: "Request emergency HVAC service",
    issue: "no_cooling",
  },
};

const PLUMBING: Record<Level, Row> = {
  high: {
    text: "Water and sewer problems spread damage fast—every hour increases tear-out, mold risk, and repair cost.",
    button: "Urgent: book a licensed plumber",
    issue: "not_sure",
  },
  medium: {
    text: "If pressure is dropping, water keeps running, or drains are backing up, this is no longer a wait-and-see situation.",
    button: "Urgent: dispatch a plumber",
    issue: "plumbing_drain_backup",
  },
  final: {
    text: "Continuing to use fixtures while a leak or backup is active can push a small fix past $1,500 once finishes are damaged.",
    button: "Stop damage — get plumbing help now",
    issue: "plumbing_leak",
  },
};

const ELECTRICAL: Record<Level, Row> = {
  high: {
    text: "Electrical faults can escalate without warning—heat, buzz, dimming, or breakers that trip are urgent signals.",
    button: "Urgent: book a licensed electrician",
    issue: "not_sure",
  },
  medium: {
    text: "If breakers will not stay on, outlets are dead, or you smell ozone, do not keep resetting or forcing power.",
    button: "Urgent: electrical dispatch",
    issue: "elec_breaker_tripping",
  },
  final: {
    text: "Panel and branch faults are not DIY under load—waiting commonly turns a $300 repair into $1,500+ once devices or feeders are damaged.",
    button: "Request emergency electrical service",
    issue: "elec_no_power",
  },
};

function rowsForPath(pathname: string | null): Record<Level, Row> {
  const trade = inferHomeServiceTradeFromPathname(pathname);
  if (trade === "plumbing") return PLUMBING;
  if (trade === "electrical") return ELECTRICAL;
  return HVAC;
}

export type HsdUrgentCtaLevel = Level;

export function HsdUrgentCta({ level = "high" }: { level?: HsdUrgentCtaLevel }) {
  const pathname = usePathname();
  const pack = useMemo(() => rowsForPath(pathname), [pathname]);
  const { text, button, issue } = pack[level];

  function openLead() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("open-leadcard", { detail: { issue } }));
  }

  return (
    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
      <p className="mb-3 font-semibold text-red-700 dark:text-red-200">{text}</p>
      <button
        type="button"
        onClick={openLead}
        className="rounded bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        {button}
      </button>
      <SmsLegalFooterLinks className="mt-3 justify-start text-[10px]" />
    </div>
  );
}
