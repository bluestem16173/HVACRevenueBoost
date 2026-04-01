import { sanitizeSlug } from "@/lib/slug/sanitize-slug";

export type PageType =
  | "system"
  | "symptom"
  | "diagnostic"
  | "cause"
  | "repair"
  | "context"
  | "component"
  | "condition";

export interface PageRow {
  id: string;
  site: "dg" | "hvac";
  slug: string;
  title: string;
  page_type: PageType;
  status: string;
  city?: string | null;
  content_json?: Record<string, unknown> | null;
}

export interface GraphLinks {
  system: string[];
  symptoms: string[];
  diagnostics: string[];
  causes: string[];
  components: string[];
  context: string[];
  repairs: string[];
}

const EMPTY_LINKS: GraphLinks = {
  system: [],
  symptoms: [],
  diagnostics: [],
  causes: [],
  components: [],
  context: [],
  repairs: [],
};

function norm(s: string): string {
  return sanitizeSlug(s);
}

function containsAny(slug: string, needles: string[]): boolean {
  return needles.some((n) => slug.includes(n));
}

function scorePair(source: PageRow, target: PageRow): number {
  if (source.id === target.id) return -999;

  let score = 0;
  const a = norm(source.slug);
  const b = norm(target.slug);

  const aTokens = new Set(a.split("-"));
  const bTokens = new Set(b.split("-"));
  const overlap = Array.from(aTokens).filter((t) => bTokens.has(t)).length;

  score += overlap * 3;

  if (source.site === target.site) score += 2;

  if (a.includes("rv") && b.includes("rv")) score += 4;
  if (!a.includes("rv") && !b.includes("rv")) score += 1;

  if (containsAny(a, ["ac", "air", "cool"]) && containsAny(b, ["ac", "air", "cool"])) score += 3;
  if (containsAny(a, ["furnace", "heat", "heating"]) && containsAny(b, ["furnace", "heat", "heating"])) score += 3;
  if (containsAny(a, ["generator"]) && containsAny(b, ["generator"])) score += 3;
  if (containsAny(a, ["water", "plumbing", "pump"]) && containsAny(b, ["water", "plumbing", "pump"])) score += 3;

  return score;
}

function topMatches(
  source: PageRow,
  rows: PageRow[],
  type: PageType,
  max: number,
): string[] {
  return rows
    .filter((r) =>
      r.page_type === type &&
      ["generated", "published", "draft", "pending", "validated"].includes(r.status)
    )
    .map((r) => ({ slug: r.slug, score: scorePair(source, r) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.slug);
}

export function buildGraphLinksForPage(source: PageRow, allRows: PageRow[]): GraphLinks {
  const links: GraphLinks = { ...EMPTY_LINKS };

  switch (source.page_type) {
    case "system":
      links.symptoms = topMatches(source, allRows, "symptom", 8);
      links.diagnostics = topMatches(source, allRows, "diagnostic", 6);
      links.repairs = topMatches(source, allRows, "repair", 4);
      break;

    case "symptom":
      links.system = topMatches(source, allRows, "system", 3);
      links.diagnostics = topMatches(source, allRows, "diagnostic", 4);
      links.context = topMatches(source, allRows, "context", 4);
      links.repairs = topMatches(source, allRows, "repair", 3);
      break;

    case "diagnostic":
      links.system = topMatches(source, allRows, "system", 3);
      links.symptoms = topMatches(source, allRows, "symptom", 4);
      links.causes = topMatches(source, allRows, "cause", 5);
      links.components = topMatches(source, allRows, "component", 4);
      links.context = topMatches(source, allRows, "context", 3);
      links.repairs = topMatches(source, allRows, "repair", 4);
      break;

    case "cause":
      links.diagnostics = topMatches(source, allRows, "diagnostic", 4);
      links.components = topMatches(source, allRows, "component", 3);
      links.repairs = topMatches(source, allRows, "repair", 4);
      break;

    case "component":
      links.causes = topMatches(source, allRows, "cause", 4);
      links.diagnostics = topMatches(source, allRows, "diagnostic", 4);
      links.repairs = topMatches(source, allRows, "repair", 4);
      break;

    case "context":
      links.diagnostics = topMatches(source, allRows, "diagnostic", 3);
      links.causes = topMatches(source, allRows, "cause", 3);
      links.repairs = topMatches(source, allRows, "repair", 2);
      break;

    case "repair":
      links.diagnostics = topMatches(source, allRows, "diagnostic", 4);
      links.causes = topMatches(source, allRows, "cause", 4);
      links.components = topMatches(source, allRows, "component", 3);
      break;

    default:
      break;
  }

  for (const key of Object.keys(links) as Array<keyof GraphLinks>) {
    links[key] = Array.from(new Set(links[key])).filter((slug) => slug !== source.slug);
  }

  return links;
}
