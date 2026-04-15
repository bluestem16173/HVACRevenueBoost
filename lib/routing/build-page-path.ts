import { buildHvacLocalizedPillarPath } from "@/lib/localized-city-path";

type PageType =
  | "system"
  | "symptom"
  | "diagnostic"
  | "cause"
  | "repair"
  | "context"
  | "component"
  | "condition";

/** Localized HVAC pillar URL: `/hvac/{pillar}/{citySlug}` (e.g. citySlug `tampa-fl`). */
export function buildHvacCityPillarPath(pillarSlug: string, citySlug: string): string {
  return buildHvacLocalizedPillarPath(pillarSlug, citySlug);
}

export function buildPagePath(
  pageType: PageType,
  slug: string,
  site: "dg" | "hvac",
  city?: string | null,
) {
  const cleanSlug = slug.trim().toLowerCase();

  if (pageType === "diagnostic") {
    if (site === "dg") return `/diagnose/${cleanSlug}`;
    return city ? `/diagnose/${city}/${cleanSlug}` : `/diagnose/${cleanSlug}`;
  }

  const baseMap: Record<PageType, string> = {
    system: "systems",
    symptom: "symptoms",
    diagnostic: "diagnose",
    cause: "causes",
    repair: "repairs",
    context: "context",
    component: "components",
    condition: "conditions",
  };

  return `/${baseMap[pageType]}/${cleanSlug}`;
}
