"use client";

import Link from "next/link";

type Tone = "default" | "onDark";

const linkClass: Record<Tone, string> = {
  default: "text-blue-700 underline hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300",
  onDark: "text-blue-200 underline hover:text-white",
};

/** Privacy + Terms links for SMS / lead CTAs (match {@link LeadCard} styling). */
export function SmsLegalFooterLinks({
  className = "",
  tone = "default",
}: {
  className?: string;
  /** Use `onDark` on navy / saturated hero backgrounds. */
  tone?: Tone;
}) {
  const lc = linkClass[tone];
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold ${className}`}>
      <Link href="/privacy" className={lc}>
        Privacy Policy
      </Link>
      <Link href="/terms" className={lc}>
        Terms & Conditions
      </Link>
    </div>
  );
}
