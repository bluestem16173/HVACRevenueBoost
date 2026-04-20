"use client";

import type { ReactNode } from "react";
import { SmsLegalFooterLinks } from "@/components/SmsLegalFooterLinks";

export function DgLeadButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="inline-flex flex-col items-stretch gap-1">
      <button
        type="button"
        className={className}
        onClick={() => window.dispatchEvent(new CustomEvent("open-leadcard"))}
      >
        {children}
      </button>
      <SmsLegalFooterLinks className="justify-center text-[10px]" />
    </div>
  );
}
