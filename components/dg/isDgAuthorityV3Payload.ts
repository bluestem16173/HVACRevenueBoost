/** True when `content_json` should use the DG_AUTHORITY_V3 Tailwind renderer. */
export function isDgAuthorityV3Payload(data: unknown): boolean {
  if (data == null || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return o.layout === "dg_authority_v3" || o.schemaVersion === "dg_authority_v3";
}
