"use client";

import { trackEvent } from "@/lib/tracking";

type Props = {
  variant?: "primary" | "secondary" | "final";
};

export default function ServiceCTA({ variant = "primary" }: Props) {
  const content = {
    primary: {
      title: "Need help fixing this fast?",
      text: "Get quotes from local HVAC professionals and avoid costly mistakes.",
    },
    secondary: {
      title: "Not comfortable doing this repair?",
      text: "Compare certified HVAC technicians in your area.",
    },
    final: {
      title: "Still not resolved?",
      text: "A professional can diagnose this quickly and prevent bigger issues.",
    },
  };

  const c = content[variant];

  return (
    <div className="mt-8 p-5 rounded-xl border bg-hvac-blue/10 dark:bg-hvac-blue/20 border-hvac-blue/30 dark:border-hvac-blue/40 text-center">
      <h3 className="font-semibold text-sm text-hvac-navy dark:text-white mb-2">{c.title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{c.text}</p>
      <button
        data-open-lead-modal
        onClick={() =>
          trackEvent("cta_click", {
            location: variant,
            page: typeof window !== "undefined" ? window.location.pathname : "",
          })
        }
        className="bg-hvac-blue hover:bg-blue-800 text-white text-xs px-4 py-2 rounded-lg font-bold transition"
      >
        Find Local HVAC Pros →
      </button>
    </div>
  );
}
