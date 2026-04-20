import { createHash } from "node:crypto";

export type DatabaseUrlRuntimeSnapshot = {
  source: "DATABASE_URL" | "DB_FALLBACK";
  hostname: string;
  database: string;
  /** First 16 hex chars of sha256(canonical URL string). Same DB → same prefix across processes. */
  urlSha256Prefix: string;
};

function canonicalDbUrl(raw: string): string {
  return raw.trim().replace(/^['"]|['"]$/g, "");
}

/**
 * Non-secret snapshot of which Postgres URL the process will use (compare Worker vs Next.js logs or `/api/diagnostics/db-url-fingerprint`).
 */
export function getDatabaseUrlRuntimeSnapshot(): DatabaseUrlRuntimeSnapshot | null {
  const prefer = process.env.DATABASE_URL;
  const fallback = process.env.DB_FALLBACK;
  const raw = canonicalDbUrl(String(prefer || fallback || ""));
  if (!raw || !/^postgres(ql)?:/i.test(raw)) return null;
  const source: DatabaseUrlRuntimeSnapshot["source"] = canonicalDbUrl(String(prefer || ""))
    ? "DATABASE_URL"
    : "DB_FALLBACK";

  let hostname = "";
  let database = "";
  try {
    const u = new URL(raw.replace(/^postgres(ql)?:/i, "http:"));
    hostname = u.hostname;
    database = (u.pathname || "").replace(/^\//, "") || "(none)";
  } catch {
    hostname = "(parse_error)";
    database = "(parse_error)";
  }

  const urlSha256Prefix = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  return { source, hostname, database, urlSha256Prefix };
}

export function formatDatabaseUrlRuntimeForLog(): string {
  const s = getDatabaseUrlRuntimeSnapshot();
  if (!s) return "[db] DATABASE_URL / DB_FALLBACK unset or not a postgres URL";
  return `[db] source=${s.source} host=${s.hostname} database=${s.database} url_sha256_prefix=${s.urlSha256Prefix}`;
}
