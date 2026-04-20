"use client";

export function StickyCTA() {
  return (
    <div className="sticky top-0 z-[60] border-b border-slate-200 bg-white/95 py-2 text-center text-xs text-slate-600 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-300">
      <span className="font-medium">Need a licensed tech?</span>{" "}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("open-lead-modal"));
          }
        }}
        className="ml-2 inline-flex items-center rounded-md border border-hvac-navy bg-hvac-navy px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-hvac-blue focus:outline-none focus:ring-2 focus:ring-hvac-gold dark:border-hvac-gold dark:bg-hvac-navy"
      >
        Get help
      </button>
    </div>
  );
}
