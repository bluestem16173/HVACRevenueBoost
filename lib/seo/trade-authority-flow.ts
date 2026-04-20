import type { ServiceVertical } from "@/lib/localized-city-path";
import { joinedSlugEndsWithCityStorage } from "@/lib/localized-city-path";

/**
 * **Authority engine URL model** (hub → pillar → city).
 *
 * ```
 * SYSTEM → PROBLEM → CITY
 *    ↑         ↓
 *    └── related ──┘
 * ```
 */

/** Tier-1 trade hubs (system pillars). */
export const SYSTEM_PILLAR_HUB_PATHS = ["/hvac", "/electrical", "/plumbing"] as const;

export const AUTHORITY_ENGINE_FLOW_DIAGRAM = `
SYSTEM → PROBLEM → CITY
   ↑         ↓
   └── related ──┘
`.trim();

/** Example national problem pillars (path under origin, no trailing slash). */
export const EXAMPLE_PROBLEM_PILLAR_PATHS = ["/hvac/ac-not-cooling", "/electrical/breaker-keeps-tripping"] as const;

/** Example localized city URLs. */
export const EXAMPLE_CITY_PAGE_PATHS = ["/hvac/ac-not-cooling/tampa-fl"] as const;

export type AuthorityPathTier = "system_pillar" | "problem_pillar" | "city_page" | "unknown";

function normalizePathname(pathname: string): string {
  const p = String(pathname ?? "")
    .split("?")[0]
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "");
  return p || "/";
}

/** True when `pathname` is exactly `/hvac`, `/plumbing`, or `/electrical`. */
export function isSystemPillarHubPath(pathname: string): boolean {
  const p = normalizePathname(pathname);
  return (SYSTEM_PILLAR_HUB_PATHS as readonly string[]).includes(p);
}

/**
 * Classify a browser pathname into the three-tier model.
 * - **system_pillar:** `/hvac` | `/electrical` | `/plumbing`
 * - **problem_pillar:** `/{vertical}/{symptom}` (no city suffix)
 * - **city_page:** `/{vertical}/{symptom}/{city-storage}` (e.g. `tampa-fl`)
 */
export function authorityPathTierFromPathname(pathname: string): AuthorityPathTier {
  const p = normalizePathname(pathname);
  if (isSystemPillarHubPath(p)) return "system_pillar";

  const parts = p.split("/").filter(Boolean);
  if (parts.length < 2) return "unknown";
  const vertical = parts[0];
  if (vertical !== "hvac" && vertical !== "plumbing" && vertical !== "electrical") return "unknown";

  const underVertical = parts.slice(1).join("/");
  if (!underVertical) return "unknown";
  if (joinedSlugEndsWithCityStorage(underVertical)) return "city_page";
  return "problem_pillar";
}

/** Vertical segment when pathname matches `/{vertical}/...`; otherwise `null`. */
export function authorityVerticalFromPathname(pathname: string): ServiceVertical | null {
  const parts = normalizePathname(pathname).split("/").filter(Boolean);
  const v = parts[0];
  if (v === "hvac" || v === "plumbing" || v === "electrical") return v;
  return null;
}
