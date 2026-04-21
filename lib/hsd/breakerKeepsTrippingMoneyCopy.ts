import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";
import { enforceStoredSlug } from "@/lib/slug-utils";

export function breakerTrippingMoneyHeadline(place: string): string {
  return `Breaker keeps tripping in ${place}?`;
}

export const BREAKER_TRIPPING_MONEY_CORE =
  "If your breaker won't stay on, don't keep resetting it — that's your electrical system telling you something is wrong.\n\nMost of the time, this comes down to:\n• Too much load on one circuit\n• A failing outlet or GFCI\n• A loose or damaged wire\n\nBut if it keeps happening, you could be dealing with overheating or a wiring fault — and that's where it becomes a safety issue.";

export const BREAKER_TRIPPING_MONEY_RISK =
  `If your breaker trips more than once, that's not normal.\n\nRepeated trips can mean:\n• Wiring overheating behind walls\n• A device pulling unsafe current\n• A fault that can escalate into fire risk\n\nThis is not something to ignore or "test" repeatedly.`;

export const BREAKER_TRIPPING_TOP_CAUSES: { label: string; probability: string; deep_dive: string }[] = [
  {
    label: "Too many devices on one circuit (overload)",
    probability: "Very common in kitchens, garages, and laundry",
    deep_dive:
      "Multiple appliances and chargers on one breaker add up until the breaker does its job under load—redistributing load or adding a circuit is the real fix, not endless resets.",
  },
  {
    label: "A bad outlet or GFCI cutting power",
    probability: "Common when one leg of the room dies",
    deep_dive:
      "Failed devices or nuisance GFCI protection can trip the branch—testing shows whether you replace a device or trace a branch fault.",
  },
  {
    label: "Loose wiring causing intermittent faults",
    probability: "Serious when trips feel random or return quickly",
    deep_dive:
      "Loose stabs and lugs create resistance and heat; the fault often appears only when current spikes—this is where fires start if ignored.",
  },
  {
    label: "A failing breaker or panel issue",
    probability: "Less common, but costly if the bus is involved",
    deep_dive:
      "Heat, buzz, or multiple circuits misbehaving can point past the branch device—panel-level diagnosis belongs to a licensed electrician.",
  },
];

/** True when slug is `electrical/breaker-keeps-tripping` or `electrical/breaker-keeps-tripping/{city}`. */
export function isElectricalBreakerTrippingSlug(slug: string): boolean {
  const n = `${enforceStoredSlug(slug).toLowerCase()}/`;
  return n.startsWith("electrical/") && n.includes("/breaker-keeps-tripping/");
}

/**
 * Forces money opener, urgency, and human top causes for breaker-tripping city pages.
 * Safe on a cloned `summary_30s` record; used by read-time coerce and v2.5 render sanitize.
 */
export function applyBreakerKeepsTrippingMoneyToSummary30s(
  s30: Record<string, unknown>,
  slugStr: string
): boolean {
  if (!isElectricalBreakerTrippingSlug(slugStr)) return false;
  const breakerCitySeg = slugStr.split("/").filter(Boolean)[2] ?? "";
  const place = breakerCitySeg ? formatCityPathSegmentForDisplay(breakerCitySeg) : "your area";
  s30.headline = breakerTrippingMoneyHeadline(place);
  s30.core_truth = BREAKER_TRIPPING_MONEY_CORE;
  s30.risk_warning = BREAKER_TRIPPING_MONEY_RISK;
  s30.top_causes = BREAKER_TRIPPING_TOP_CAUSES.map((c) => ({ ...c }));
  return true;
}
