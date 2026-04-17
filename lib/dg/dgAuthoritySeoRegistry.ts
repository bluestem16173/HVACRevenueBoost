import type { Trade } from "@/lib/dg/resolveCTA";

export function inferTradeFromSlug(slug: string): Trade {
  const head = slug.split("/").filter(Boolean)[0]?.toLowerCase();
  if (head === "plumbing" || head === "electrical") return head;
  return "hvac";
}

/** Curated internal targets for DG v3 SEO + related diagnostics (renderer-controlled). */
export type DgAuthoritySeoPage = {
  href: string;
  title: string;
  trade: Trade;
  /** Lowercase tokens (3+ chars) for overlap with page title + summary. */
  keywords: string[];
};

export const DG_AUTHORITY_PHRASE_LINKS: {
  phrase: string;
  href: string;
  trades: Trade[];
}[] = [
  { phrase: "frozen evaporator coil", href: "/hvac/frozen-evaporator-coil/tampa", trades: ["hvac"] },
  { phrase: "frozen coil", href: "/hvac/frozen-evaporator-coil/tampa", trades: ["hvac"] },
  { phrase: "weak airflow", href: "/hvac/weak-airflow/tampa", trades: ["hvac"] },
  { phrase: "short cycling", href: "/hvac/ac-short-cycling/tampa", trades: ["hvac"] },
  { phrase: "outside unit not running", href: "/hvac/outside-unit-not-running/tampa", trades: ["hvac"] },
  { phrase: "breaker trips", href: "/electrical/circuit-overload/tampa", trades: ["electrical"] },
  { phrase: "circuit overload", href: "/electrical/circuit-overload/tampa", trades: ["electrical"] },
  { phrase: "no hot water", href: "/plumbing/no-hot-water/tampa", trades: ["plumbing"] },
  { phrase: "water heater", href: "/plumbing/water-heater/tampa", trades: ["plumbing"] },
];

export const DG_AUTHORITY_SEO_PAGES: DgAuthoritySeoPage[] = [
  {
    href: "/hvac/ac-not-cooling",
    title: "AC not cooling",
    trade: "hvac",
    keywords: ["cooling", "warm", "refrigerant", "condenser", "compressor"],
  },
  {
    href: "/hvac/weak-airflow/tampa",
    title: "Weak airflow (Tampa)",
    trade: "hvac",
    keywords: ["airflow", "duct", "filter", "static", "blower"],
  },
  {
    href: "/hvac/frozen-evaporator-coil/tampa",
    title: "Frozen evaporator coil (Tampa)",
    trade: "hvac",
    keywords: ["frozen", "ice", "coil", "evaporator"],
  },
  {
    href: "/hvac/ac-short-cycling/tampa",
    title: "AC short cycling (Tampa)",
    trade: "hvac",
    keywords: ["short", "cycling", "rapid", "thermostat"],
  },
  {
    href: "/hvac/outside-unit-not-running/tampa",
    title: "Outside unit not running (Tampa)",
    trade: "hvac",
    keywords: ["outdoor", "condenser", "contactor", "capacitor"],
  },
  {
    href: "/plumbing/no-hot-water/tampa",
    title: "No hot water (Tampa)",
    trade: "plumbing",
    keywords: ["water", "heater", "tank", "element", "gas"],
  },
  {
    href: "/plumbing/water-heater/tampa",
    title: "Water heater diagnostics (Tampa)",
    trade: "plumbing",
    keywords: ["water", "heater", "tank", "temperature"],
  },
  {
    href: "/electrical/circuit-overload/tampa",
    title: "Circuit overload (Tampa)",
    trade: "electrical",
    keywords: ["breaker", "overload", "trip", "amps", "panel"],
  },
  {
    href: "/hvac",
    title: "HVAC hub",
    trade: "hvac",
    keywords: ["hvac", "cooling", "heating", "maintenance"],
  },
  {
    href: "/plumbing",
    title: "Plumbing hub",
    trade: "plumbing",
    keywords: ["plumbing", "drain", "leak", "fixture"],
  },
  {
    href: "/electrical",
    title: "Electrical hub",
    trade: "electrical",
    keywords: ["electrical", "breaker", "panel", "voltage"],
  },
];

export const DG_REPAIR_MATRIX_SEO_LINE: Record<Trade, { href: string; before: string; anchor: string }> = {
  hvac: {
    href: "/cost/ac-repair",
    before: "See full breakdown:",
    anchor: "AC repair costs",
  },
  plumbing: {
    href: "/cost/water-heater",
    before: "See full breakdown:",
    anchor: "Water heater repair costs",
  },
  electrical: {
    href: "/cost/electrical-panel",
    before: "See full breakdown:",
    anchor: "Electrical panel work costs",
  },
};
