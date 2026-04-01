export type NormalizeContentOptions = {
  /** Route slug (e.g. symptom) — applied for v2 gold payloads so templates receive canonical breadcrumbs. */
  slug?: string;
};

/**
 * Align DB `pages.schema_version` with `content_json` payload fields before templates read the row.
 * Call once; treat the return value as canonical for rendering.
 *
 * Does NOT truncate, merge unrelated fields, or simplify strings — only JSON-parse, spread, and
 * set schemaVersion/slug for v2 gold pages.
 */
export function normalizeContent(
  raw: any,
  schema: string,
  options?: NormalizeContentOptions
) {
  if (raw == null) {
    return raw;
  }

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (schema === "v2_goldstandard") {
    return {
      ...parsed,
      ...(options?.slug != null && options.slug !== ""
        ? { slug: options.slug }
        : {}),
      schemaVersion: "v1",
    };
  }

  return parsed;
}