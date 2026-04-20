/**
 * Optional gate: every `internal_links` path must exist in a caller-supplied graph (e.g. DB slugs,
 * route manifest). {@link validatePage} only checks prefix shape + list sizes, not target existence.
 */

const HUB_LINK_KEYS = [
  "related_symptoms",
  "causes",
  "system_pages",
  "repair_guides",
  "context_pages",
] as const;

export type HsdHubInternalLinksKey = (typeof HUB_LINK_KEYS)[number];

/** Align with hub JSON: trim and strip a leading slash (see `nonEmptySlugPath` / trade format checks). */
export function normalizeHsdInternalLinkPath(raw: string): string {
  return String(raw ?? "")
    .trim()
    .replace(/^\/+/, "");
}

/**
 * @param graphSet Allowed target paths after {@link normalizeHsdInternalLinkPath} (e.g. `hvac/ac-not-cooling`, `repair/tampa-fl/weak-airflow`).
 */
export function assertValidInternalLinksAgainstSet(
  page: Record<string, unknown>,
  graphSet: ReadonlySet<string>,
): void {
  const il = page.internal_links;
  if (!il || typeof il !== "object") {
    throw new Error("assertValidInternalLinks: missing internal_links object");
  }
  const o = il as Record<string, unknown>;
  const allowed = new Set(
    Array.from(graphSet, (s) => normalizeHsdInternalLinkPath(s)).filter(Boolean),
  );

  for (const key of HUB_LINK_KEYS) {
    const list = o[key];
    if (!Array.isArray(list)) {
      throw new Error(`assertValidInternalLinks: internal_links.${key} must be an array`);
    }
    for (const item of list) {
      if (typeof item !== "string") continue;
      const link = normalizeHsdInternalLinkPath(item);
      if (!link || /^https?:\/\//i.test(link)) continue;
      if (!allowed.has(link)) {
        throw new Error(`Invalid internal link on internal_links.${key}: "${item}"`);
      }
    }
  }
}
