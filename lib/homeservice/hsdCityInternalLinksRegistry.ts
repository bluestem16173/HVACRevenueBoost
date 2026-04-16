/**
 * Exact `internal_links` for known Home Service Diagnostics city pages (Tampa FL).
 * Step 4 registry — merge over LLM output so links never drift.
 */

import { enforceStoredSlug } from "@/lib/slug-utils";

export type HsdCityDiagnosticInternalLinks = {
  parent: string;
  siblings: [string, string, string];
  service: string;
  authority: string;
};

/** Normalize queue slug or path to a single lookup key (leading slash, no trailing slash). */
export function normalizeHsdCityPagePath(slugOrPath: string): string {
  let p = enforceStoredSlug(slugOrPath).replace(/\\/g, "/").replace(/\/+/g, "/");
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p.toLowerCase();
}

const TAMPA_HVAC_PLUMBING: Record<string, HsdCityDiagnosticInternalLinks> = {
  "/hvac/ac-not-cooling/tampa-fl": {
    parent: "/hvac",
    siblings: [
      "/hvac/ac-not-turning-on/tampa-fl",
      "/hvac/ac-freezing-up/tampa-fl",
      "/hvac/ac-blowing-warm-air/tampa-fl",
    ],
    service: "/hvac/ac-repair/tampa-fl",
    authority: "/hvac/how-central-air-conditioning-works",
  },
  "/hvac/ac-not-turning-on/tampa-fl": {
    parent: "/hvac",
    siblings: [
      "/hvac/ac-not-cooling/tampa-fl",
      "/hvac/thermostat-not-working/tampa-fl",
      "/hvac/ac-freezing-up/tampa-fl",
    ],
    service: "/hvac/emergency-hvac-repair/tampa-fl",
    authority: "/hvac/how-central-air-conditioning-works",
  },
  "/hvac/ac-freezing-up/tampa-fl": {
    parent: "/hvac",
    siblings: [
      "/hvac/ac-not-cooling/tampa-fl",
      "/hvac/ac-blowing-warm-air/tampa-fl",
      "/hvac/thermostat-not-working/tampa-fl",
    ],
    service: "/hvac/ac-repair/tampa-fl",
    authority: "/hvac/how-central-air-conditioning-works",
  },
  "/hvac/ac-blowing-warm-air/tampa-fl": {
    parent: "/hvac",
    siblings: [
      "/hvac/ac-not-cooling/tampa-fl",
      "/hvac/ac-freezing-up/tampa-fl",
      "/hvac/ac-not-turning-on/tampa-fl",
    ],
    service: "/hvac/ac-repair/tampa-fl",
    authority: "/hvac/how-central-air-conditioning-works",
  },
  "/hvac/thermostat-not-working/tampa-fl": {
    parent: "/hvac",
    siblings: [
      "/hvac/ac-not-turning-on/tampa-fl",
      "/hvac/ac-not-cooling/tampa-fl",
      "/hvac/ac-blowing-warm-air/tampa-fl",
    ],
    service: "/hvac/emergency-hvac-repair/tampa-fl",
    authority: "/hvac/how-central-air-conditioning-works",
  },
  "/plumbing/water-heater-not-working/tampa-fl": {
    parent: "/plumbing",
    siblings: [
      "/plumbing/no-hot-water/tampa-fl",
      "/plumbing/water-heater-leaking/tampa-fl",
      "/plumbing/toilet-keeps-running/tampa-fl",
    ],
    service: "/plumbing/water-heater-repair/tampa-fl",
    authority: "/plumbing/how-water-heaters-work",
  },
  "/plumbing/no-hot-water/tampa-fl": {
    parent: "/plumbing",
    siblings: [
      "/plumbing/water-heater-not-working/tampa-fl",
      "/plumbing/water-heater-leaking/tampa-fl",
      "/plumbing/shower-drain-clogged/tampa-fl",
    ],
    service: "/plumbing/water-heater-repair/tampa-fl",
    authority: "/plumbing/how-water-heaters-work",
  },
  "/plumbing/water-heater-leaking/tampa-fl": {
    parent: "/plumbing",
    siblings: [
      "/plumbing/water-heater-not-working/tampa-fl",
      "/plumbing/no-hot-water/tampa-fl",
      "/plumbing/toilet-keeps-running/tampa-fl",
    ],
    service: "/plumbing/water-heater-repair/tampa-fl",
    authority: "/plumbing/how-water-heaters-work",
  },
  "/plumbing/toilet-keeps-running/tampa-fl": {
    parent: "/plumbing",
    siblings: [
      "/plumbing/shower-drain-clogged/tampa-fl",
      "/plumbing/no-hot-water/tampa-fl",
      "/plumbing/water-pressure-low/tampa-fl",
    ],
    service: "/plumbing/emergency-plumber/tampa-fl",
    authority: "/plumbing/how-water-heaters-work",
  },
  "/plumbing/shower-drain-clogged/tampa-fl": {
    parent: "/plumbing",
    siblings: [
      "/plumbing/toilet-keeps-running/tampa-fl",
      "/plumbing/main-sewer-line-clogged/tampa-fl",
      "/plumbing/no-hot-water/tampa-fl",
    ],
    service: "/plumbing/emergency-plumber/tampa-fl",
    authority: "/plumbing/how-water-heaters-work",
  },
};

export function getHsdTampaPresetInternalLinks(
  slugOrPath: string
): HsdCityDiagnosticInternalLinks | undefined {
  const key = normalizeHsdCityPagePath(slugOrPath);
  return TAMPA_HVAC_PLUMBING[key];
}

/** Known registry paths (for tests / tooling). */
export const HSD_TAMPA_PRESET_INTERNAL_LINK_PATHS = Object.freeze(
  Object.keys(TAMPA_HVAC_PLUMBING)
);

/**
 * If `slugOrPath` matches a Tampa preset row, replace `internal_links` on the payload.
 */
export function applyHsdTampaPresetInternalLinks<T extends Record<string, unknown>>(
  payload: T,
  slugOrPath: string
): T {
  const preset = getHsdTampaPresetInternalLinks(slugOrPath);
  if (!preset) return payload;
  const siblings = [...preset.siblings] as string[];
  return {
    ...payload,
    internal_links: {
      parent: preset.parent,
      siblings,
      service: preset.service,
      authority: preset.authority,
    },
  };
}
