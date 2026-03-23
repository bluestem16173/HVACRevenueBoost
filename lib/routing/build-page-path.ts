type PageType =
  | "system"
  | "symptom"
  | "diagnostic"
  | "cause"
  | "repair"
  | "context"
  | "component"
  | "condition";

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
