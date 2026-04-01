/**
 * Map a generation_queue row to a best-effort “live site” path for human preview
 * before authorizing an orchestrator run (existing published page, if any).
 */
export function buildQueueJobPreviewUrl(job: Record<string, unknown>): string {
  const raw = String(job.proposed_slug ?? "").trim().replace(/^\/+/, "");
  const pageType = String(job.page_type ?? "symptom").toLowerCase();

  if (!raw) return "/diagnose";

  if (pageType === "repair" || raw.startsWith("repair/")) {
    const path = raw.startsWith("repair/") ? raw : `repair/${raw}`;
    const parts = path.split("/").filter(Boolean);
    if (parts.length >= 3) return `/${parts[0]}/${parts[1]}/${parts[2]}`;
    return `/${path}`;
  }

  if (raw.startsWith("emergency/")) {
    const parts = raw.split("/").filter(Boolean);
    if (parts.length >= 3) return `/${parts[0]}/${parts[1]}/${parts[2]}`;
    return `/${raw}`;
  }

  const bare = raw.replace(/^diagnose\//, "");
  return `/diagnose/${bare}`;
}
