import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";

/** Refuse `pages.status = published` when the serialized payload is obviously empty / stubbed. */
const MIN_SERIALIZED_BYTES = 900;

/**
 * Block publishing when title or body is missing or clearly non-substantive.
 * Call immediately before any `INSERT`/`UPDATE … status = 'published'` for generated pages.
 */
export function assertPayloadSubstantiveForPublish(slug: string, payload: Record<string, unknown>): void {
  const clean = String(slug || "").trim() || "(unknown slug)";
  const title = String(payload.title ?? "").trim();
  if (!title) {
    console.error("❌ refusing publish (missing title):", clean);
    throw new Error(`refusing publish (missing title): ${clean}`);
  }
  if (title.length < 8) {
    console.error("❌ refusing publish (title too short):", clean, JSON.stringify(title));
    throw new Error(`refusing publish (title too short): ${clean}`);
  }
  if (title.toLowerCase() === "untitled") {
    console.error("❌ refusing publish (untitled):", clean);
    throw new Error(`refusing publish (untitled): ${clean}`);
  }

  const blob = JSON.stringify(payload);
  if (blob.length < MIN_SERIALIZED_BYTES) {
    console.error("❌ refusing publish (payload too small):", clean, `${blob.length}b`);
    throw new Error(`refusing publish (payload ${blob.length}b < ${MIN_SERIALIZED_BYTES}b): ${clean}`);
  }

  const schema = String(payload.schema_version ?? "").trim();
  const looksHsdV25 =
    schema === HSD_V2_SCHEMA_VERSION ||
    payload.page_type === "city_symptom" ||
    payload.page_type === "problem_pillar" ||
    payload.summary_30s != null ||
    Array.isArray(payload.diagnostic_steps);

  if (looksHsdV25) {
    const steps = payload.diagnostic_steps;
    const sections = (payload as { sections?: unknown }).sections;
    const rm = payload.repair_matrix;
    const qc = payload.quick_checks;
    const ok =
      (Array.isArray(steps) && steps.length > 0) ||
      (Array.isArray(sections) && sections.length > 0) ||
      (Array.isArray(rm) && rm.length > 0) ||
      (Array.isArray(qc) && qc.length > 0);
    if (!ok) {
      console.error("❌ refusing publish (no substantive HSD body arrays):", clean);
      throw new Error(
        `refusing publish (empty diagnostic_steps/sections/repair_matrix/quick_checks): ${clean}`
      );
    }
  }
}
