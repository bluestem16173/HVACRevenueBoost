import type { HomeServiceTrade } from "@/lib/homeservice/inferHomeServiceTrade";
import { inferHomeServiceTradeFromPathname } from "@/lib/homeservice/inferHomeServiceTrade";

export function tradeFromLeadProfile(p: LeadCardProfile): HomeServiceTrade {
  if (p === "plumbing") return "plumbing";
  if (p === "electrical") return "electrical";
  return "hvac";
}

/** Explicit LeadCard modes — use `profile` on {@link LeadCard} or `?profile=` on `/request-service`. */
export const LEAD_CARD_PROFILES = ["hvac_cooling", "hvac_heating", "plumbing", "electrical", "rv_hvac"] as const;
export type LeadCardProfile = (typeof LEAD_CARD_PROFILES)[number];

export const LEAD_CARD_PROFILE_LABELS: Record<LeadCardProfile, string> = {
  hvac_cooling: "HVAC — cooling / AC",
  hvac_heating: "HVAC — heating / furnace",
  plumbing: "Plumbing",
  electrical: "Electrical",
  rv_hvac: "RV HVAC",
};

export function isLeadCardProfile(v: string): v is LeadCardProfile {
  return (LEAD_CARD_PROFILES as readonly string[]).includes(v);
}

/**
 * Resolves which LeadCard experience to show when `profile` is not passed explicitly.
 * Plumbing/electrical follow the URL prefix; HVAC cooling vs heating uses `serviceType`, issue, then path cues.
 */
export function inferLeadCardProfile(opts: {
  pathname: string | null | undefined;
  issue?: string;
  serviceType?: "hvac" | "heating" | "rv_hvac" | "ac";
}): LeadCardProfile {
  const path = opts.pathname ?? "";
  const trade = inferHomeServiceTradeFromPathname(path);
  if (trade === "plumbing") return "plumbing";
  if (trade === "electrical") return "electrical";

  const st = opts.serviceType;
  if (st === "rv_hvac") return "rv_hvac";
  if (st === "ac" || st === "hvac") return "hvac_cooling";
  if (st === "heating") return "hvac_heating";

  const iss = opts.issue ?? "";
  if (iss === "no_heat" || iss === "blowing_cold") return "hvac_heating";
  if (iss === "no_cooling" || iss === "blowing_warm") return "hvac_cooling";

  const low = path.toLowerCase();
  if (
    low.includes("furnace") ||
    low.includes("no-heat") ||
    low.includes("not-heating") ||
    low.includes("/heating") ||
    (low.includes("heat") && !low.includes("heat-pump") && low.includes("hvac"))
  ) {
    return "hvac_heating";
  }

  return "hvac_cooling";
}
