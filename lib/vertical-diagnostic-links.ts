import type { ServiceVertical } from "@/lib/localized-city-path";
import { buildLocalizedPillarPath } from "@/lib/localized-city-path";

/** Sibling slugs for “same city” internal linking (subset per vertical). */
const SIBLING_POOL: Record<ServiceVertical, string[]> = {
  hvac: ["ac-not-cooling", "ac-not-turning-on", "ac-freezing-up", "weak-airflow", "furnace-not-heating"],
  plumbing: [
    "no-hot-water",
    "water-heater-leaking",
    "drain-clogged",
    "toilet-keeps-running",
    "low-water-pressure",
    "main-sewer-line-clogged",
  ],
  electrical: [
    "breaker-keeps-tripping",
    "power-out-in-one-room",
    "outlet-not-working",
    "lights-flickering",
    "whole-house-power-out",
  ],
};

export function siblingSlugsFor(vertical: ServiceVertical, currentSlug: string, limit = 3): string[] {
  const pool = SIBLING_POOL[vertical] || [];
  return pool.filter((s) => s !== currentSlug).slice(0, limit);
}

export function parentHubPath(vertical: ServiceVertical): string {
  return `/${vertical}`;
}

/** Generic repair funnel (Florida grid lives on `/repair`). */
export function serviceHubPath(): string {
  return "/repair";
}

export type VerticalNavModel = {
  vertical: ServiceVertical;
  pillarSlug: string;
  citySlug?: string | null;
};

export function localizedSiblingHref(model: VerticalNavModel, siblingSlug: string): string {
  if (model.citySlug) {
    return buildLocalizedPillarPath(model.vertical, siblingSlug, model.citySlug);
  }
  return `/${model.vertical}/${siblingSlug}`;
}
