"use client";

import type { ReactNode } from "react";

export function DgLeadButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent("open-leadcard"))}
    >
      {children}
    </button>
  );
}
