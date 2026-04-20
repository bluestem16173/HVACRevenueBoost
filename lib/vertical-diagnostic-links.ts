import type { ServiceVertical } from "@/lib/localized-city-path";
import { buildLocalizedPillarPath } from "@/lib/localized-city-path";
import { getRelatedSlugsForVertical } from "@/lib/homeservice/masterProblemPillarClusters";
import { ELECTRICAL, PLUMBING } from "@/lib/trade-symptom-slugs";

/** Fallback pool when the slug is outside `PROBLEM_CLUSTERS_BY_VERTICAL` (`masterProblemPillarClusters.ts`). */
const SIBLING_POOL: Record<ServiceVertical, string[]> = {
  hvac: ["ac-not-cooling", "ac-not-turning-on", "ac-freezing-up", "weak-airflow", "furnace-not-heating"],
  plumbing: [...PLUMBING],
  electrical: [...ELECTRICAL],
};

export function siblingSlugsFor(vertical: ServiceVertical, currentSlug: string, limit = 3): string[] {
  const fromCluster = getRelatedSlugsForVertical(vertical, currentSlug);
  if (fromCluster.length) return fromCluster.slice(0, limit);
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
