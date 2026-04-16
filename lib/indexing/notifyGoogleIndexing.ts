/**
 * Google Indexing API (URL_UPDATED). Optional: set `GOOGLE_INDEXING_ACCESS_TOKEN`
 * (OAuth2 access token with `https://www.googleapis.com/auth/indexing` scope).
 *
 * Without a token this is a no-op (`skipped: true`) so workers never fail in dev.
 *
 * @see https://developers.google.com/search/apis/indexing-api/v3/using-api
 */
export type NotifyIndexingResult =
  | { ok: true; skipped: true }
  | { ok: true; skipped?: false; status: number }
  | { ok: false; status: number; body: string };

export function getSiteOrigin(): string {
  const vercel = process.env.VERCEL_URL;
  const fromVercel =
    vercel && !vercel.startsWith("http") ? `https://${vercel}` : vercel || "";
  const raw =
    process.env.SITE_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || fromVercel || "";
  return String(raw).replace(/\/$/, "");
}

/** Full canonical URL for a path beginning with `/`. */
export function canonicalUrlForPath(path: string): string {
  const base = getSiteOrigin();
  if (!base) return "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function notifyGoogleIndexing(url: string): Promise<NotifyIndexingResult> {
  const token = process.env.GOOGLE_INDEXING_ACCESS_TOKEN?.trim();
  if (!token || !url) {
    return { ok: true, skipped: true };
  }

  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, type: "URL_UPDATED" }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, status: res.status, body };
  }
  return { ok: true, skipped: false, status: res.status };
}
