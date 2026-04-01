/**
 * Optional "gold" check for maintenance jobs — not the same as queue validation.
 * Tune thresholds to match your quality_score / schema_version policy.
 */
export function isGoldStandardPageRow(row: {
  schema_version?: string | null;
  quality_score?: number | null;
}): boolean {
  if (row.schema_version === "v2_goldstandard") return true;
  const q = row.quality_score;
  if (typeof q === "number" && !Number.isNaN(q) && q >= 70) return true;
  return false;
}
