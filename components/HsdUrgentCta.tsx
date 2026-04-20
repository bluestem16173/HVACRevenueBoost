"use client";

const content = {
  high: {
    text: "At this point, every extra hour of runtime increases the risk of a $1,500\u2013$3,500 repair.",
    button: "Get HVAC Help Now",
  },
  medium: {
    text: "If basic checks didn't fix it, the issue is no longer simple.",
    button: "Check Availability",
  },
  final: {
    text: "Stop running the system before this becomes a major repair.",
    button: "Request Service Now",
  },
} as const;

export type HsdUrgentCtaLevel = keyof typeof content;

function openLead() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("open-lead-modal"));
}

export function HsdUrgentCta({ level = "high" }: { level?: HsdUrgentCtaLevel }) {
  const { text, button } = content[level];

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
    </div>
  );
}
