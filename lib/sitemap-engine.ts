/**
 * Phase 16: Layered Sitemap Engine
 * Supports 100k+ URLs with chunked sitemaps (≤5000 URLs per file).
 * Master index → Layer indexes → Chunked sitemaps.
 */

import sql from "@/lib/db";
import { CLUSTERS } from "@/lib/clusters";
import { HVAC_CORE_CLUSTER_SYMPTOM_ORDER } from "@/lib/homeservice/hsdHvacCoreCluster";
import { siteCanonicalDiagnoseUrl, siteCanonicalUrl } from "@/lib/seo/canonical";
import { isStrictIndexingEnabled, rowPassesIndexableSince } from "@/lib/seo/strict-indexing";
import { getTierOneCityStorageSlugs, isTierOneDiscoverableStorageSlug } from "@/lib/seo/tier-one-discovery";
import { enforceStoredSlug, isLocalizedPillarPageSlug } from "@/lib/slug-utils";
import { CONDITIONS } from "@/lib/conditions";
import { SYMPTOMS, CAUSES, REPAIRS } from "@/data/knowledge-graph";
import { CITIES } from "@/data/knowledge-graph";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.hvacrevenueboost.com";
const CHUNK_SIZE = 5000;

export type SitemapLayer =
  | "static"
  | "clusters"
  | "symptoms"
  | "conditions"
  | "causes"
  | "repairs"
  | "components"
  | "local";

export interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq?: string;
  priority?: number;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toLastmod(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Tier-1 HVAC localized URLs (core cluster × `TIER_ONE_CITIES`; same cohort as on-page related links). */
export function getHvacTampaCitySymptomEntries(): SitemapEntry[] {
  const now = toLastmod(new Date());
  const entries: SitemapEntry[] = [];
  for (const city of getTierOneCityStorageSlugs()) {
    for (const sym of HVAC_CORE_CLUSTER_SYMPTOM_ORDER) {
      entries.push({
        loc: `${BASE_URL}/hvac/${sym}/${city}`,
        lastmod: now,
        changefreq: "weekly" as const,
        priority: 0.75,
      });
    }
  }
  return entries;
}

/** Static + pillar routes */
export function getStaticEntries(): SitemapEntry[] {
  const now = toLastmod(new Date());
  if (isStrictIndexingEnabled()) {
    return [{ loc: `${BASE_URL}/`, lastmod: now, changefreq: "daily", priority: 1 }];
  }
  const routes = [
    { url: "", priority: 1.0, changefreq: "daily" as const },
    { url: "/repair", priority: 0.9, changefreq: "weekly" as const },
    { url: "/diagnose", priority: 0.9, changefreq: "weekly" as const },
    { url: "/hvac", priority: 0.8, changefreq: "weekly" as const },
    { url: "/plumbing", priority: 0.8, changefreq: "weekly" as const },
    { url: "/electrical", priority: 0.8, changefreq: "weekly" as const },
    { url: "/hvac-air-conditioning", priority: 0.8, changefreq: "weekly" as const },
    { url: "/hvac-heating-systems", priority: 0.8, changefreq: "weekly" as const },
    { url: "/hvac-airflow-ductwork", priority: 0.8, changefreq: "weekly" as const },
    { url: "/hvac-electrical-controls", priority: 0.8, changefreq: "weekly" as const },
    { url: "/hvac-thermostats-controls", priority: 0.8, changefreq: "weekly" as const },
    { url: "/hvac-maintenance", priority: 0.8, changefreq: "weekly" as const },
  ];
  return routes.map((r) => ({
    loc: `${BASE_URL}${r.url}`,
    lastmod: now,
    changefreq: r.changefreq,
    priority: r.priority,
  }));
}

/** Systems (DecisionGrid) */
export async function getSystemEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  try {
    const rows = await sql`SELECT slug FROM systems`;
    return (rows as any[]).map((r) => ({
      loc: `${BASE_URL}/system/${r.slug}`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.8,
    }));
  } catch {
    return [
      { loc: `${BASE_URL}/system/residential-ac`, lastmod: now, changefreq: "weekly", priority: 0.8 },
      { loc: `${BASE_URL}/system/rv-ac`, lastmod: now, changefreq: "weekly", priority: 0.8 },
      { loc: `${BASE_URL}/system/mini-split`, lastmod: now, changefreq: "weekly", priority: 0.8 },
      { loc: `${BASE_URL}/system/rooftop-hvac`, lastmod: now, changefreq: "weekly", priority: 0.8 },
    ];
  }
}

function locFromPublishedPageSlug(slug: string): string {
  const s = enforceStoredSlug(slug).toLowerCase();
  if (!s) return `${BASE_URL}/`;
  if (s.startsWith("diagnose/")) {
    const rest = s.slice("diagnose/".length);
    return siteCanonicalDiagnoseUrl(rest);
  }
  /** `app/[...slug]` trade + HVAC deep pages use path canonicals, not `/diagnose/…`. */
  const head = s.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
  if (head === "hvac" || head === "plumbing" || head === "electrical") {
    return siteCanonicalUrl(`/${s}`);
  }
  return siteCanonicalDiagnoseUrl(s);
}

/**
 * Published Lee plumbing + electrical locals (Tier-1 grid) — for strict `sitemap.xml` child urlset.
 * Loc matches page metadata (`/{vertical}/{symptom}/{city}`).
 */
export async function getTradeTierOneLocalizedEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  try {
    const rows = await sql`
      SELECT slug, created_at, updated_at
      FROM pages
      WHERE status = 'published'
        AND slug ~ '^(plumbing|electrical)/[a-z0-9-]+/[a-z0-9-]+$'
    `;
    return (rows as { slug?: unknown; created_at?: unknown; updated_at?: unknown }[])
      .filter((r) => rowPassesIndexableSince(r.updated_at, r.created_at))
      .filter((r) => isTierOneDiscoverableStorageSlug(String(r.slug ?? "")))
      .map((r) => {
        const slug = enforceStoredSlug(String(r.slug ?? "")).toLowerCase();
        return {
          loc: siteCanonicalUrl(`/${slug}`),
          lastmod: r.updated_at
            ? toLastmod(new Date(String(r.updated_at)))
            : r.created_at
              ? toLastmod(new Date(String(r.created_at)))
              : now,
          changefreq: "weekly" as const,
          priority: 0.85,
        };
      });
  } catch {
    return [];
  }
}

/** Diagnostics (DecisionGrid wizard) */
export async function getDiagnosticEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  try {
    const rows = await sql`SELECT slug, created_at, updated_at FROM pages WHERE status = 'published'`;
    return (rows as any[])
      .filter((r) => rowPassesIndexableSince(r.updated_at, r.created_at))
      .filter((r) => {
        const slug = String(r.slug ?? "");
        if (isLocalizedPillarPageSlug(slug)) {
          return isTierOneDiscoverableStorageSlug(slug);
        }
        return true;
      })
      .map((r) => ({
        loc: locFromPublishedPageSlug(r.slug),
        lastmod: r.updated_at ? toLastmod(new Date(r.updated_at)) : (r.created_at ? toLastmod(new Date(r.created_at)) : now),
        changefreq: "weekly" as const,
        priority: 0.8,
      }));
  } catch {
    return [];
  }
}

/** Cities (lead gen) */
export async function getCityEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  try {
    const rows = await sql`SELECT slug FROM cities`;
    const fromDb = (rows as any[]).map((r) => ({
      loc: `${BASE_URL}/repair/${r.slug}`,
      lastmod: now,
      changefreq: "monthly",
      priority: 0.6,
    }));
    if (fromDb.length > 0) return fromDb;
  } catch {}
  return CITIES.map((c) => ({
    loc: `${BASE_URL}/repair/${c.slug}`,
    lastmod: now,
    changefreq: "monthly",
    priority: 0.6,
  }));
}

/** Cluster pages */
export function getClusterEntries(): SitemapEntry[] {
  const now = toLastmod(new Date());
  return CLUSTERS.map((c) => ({
    loc: `${BASE_URL}/cluster/${c.slug}`,
    lastmod: now,
    changefreq: "weekly",
    priority: 0.9,
  }));
}

/** Symptom pages from static + DB (URGENT SEO TARGETS) */
export async function getSymptomEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  const staticEntries: SitemapEntry[] = SYMPTOMS.map((s) => ({
    loc: `${BASE_URL}/diagnose/${s.id}`,
    lastmod: now,
    changefreq: "weekly",
    priority: 0.9,
  }));

  try {
    const pages = await sql`
      SELECT slug, created_at, updated_at FROM pages
      WHERE slug LIKE 'diagnose/%'
        AND status = 'published'
        AND (quality_status IS NULL OR quality_status != 'noindex')
        AND content_json->'hero'->>'headline' != 'Troubleshoot the issue step by step'
        AND (canonical_slug IS NULL OR canonical_slug = slug)
      ORDER BY updated_at DESC
      LIMIT 50000
    `;
    const dbEntries: SitemapEntry[] = (pages as any[])
      .filter((p) => p.slug && !p.slug.includes('//') && p.slug === p.slug.trim()) // Clean slugs only
      .map((p) => ({
        loc: `${BASE_URL}/${p.slug}`,
        lastmod: toLastmod(new Date(p.updated_at || p.created_at || Date.now())),
        changefreq: "weekly",
        priority: 0.9,
      }));
    const seen = new Set(staticEntries.map((e) => e.loc));
    const unique = dbEntries.filter((e) => !seen.has(e.loc));
    return [...staticEntries, ...unique];
  } catch {
    return staticEntries;
  }
}

/** Condition pages — static knowledge graph + AI-generated from DB */
export async function getConditionEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  const staticEntries: SitemapEntry[] = CONDITIONS.map((c) => ({
    loc: `${BASE_URL}/conditions/${c.slug}`,
    lastmod: now,
    changefreq: "monthly",
    priority: 0.7,
  }));

  try {
    const pages = await sql`
      SELECT slug, created_at, updated_at FROM pages
      WHERE slug LIKE 'conditions/%'
        AND (status = 'published' OR status = 'generated')
        AND (canonical_slug IS NULL OR canonical_slug = slug)
      ORDER BY updated_at DESC
      LIMIT 10000
    `;
    const dbEntries: SitemapEntry[] = (pages as any[]).map((p) => ({
      loc: `${BASE_URL}/${p.slug}`,
      lastmod: toLastmod(new Date(p.updated_at || p.created_at || Date.now())),
      changefreq: "monthly",
      priority: 0.7,
    }));
    const seen = new Set(staticEntries.map((e) => e.loc));
    const unique = dbEntries.filter((e) => !seen.has(e.loc));
    return [...staticEntries, ...unique];
  } catch {
    return staticEntries;
  }
}

/** Cause pages - from knowledge graph + DB */
export async function getCauseEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  const causes = Object.keys(CAUSES);
  const staticEntries: SitemapEntry[] = causes.map((slug) => ({
    loc: `${BASE_URL}/cause/${slug}`,
    lastmod: now,
    changefreq: "monthly",
    priority: 0.7,
  }));

  try {
    const pages = await sql`
      SELECT slug, created_at FROM pages
      WHERE quality_status = 'published' AND quality_score >= 70 AND slug LIKE 'cause/%'
        AND (canonical_slug IS NULL OR canonical_slug = slug)
      LIMIT 50000
    `;
    const dbEntries: SitemapEntry[] = (pages as any[]).map((p) => ({
      loc: `${BASE_URL}/${p.slug}`,
      lastmod: toLastmod(new Date(p.created_at || Date.now())),
      changefreq: "monthly",
      priority: 0.7,
    }));
    const seen = new Set(staticEntries.map((e) => e.loc));
    const unique = dbEntries.filter((e) => !seen.has(e.loc));
    return [...staticEntries, ...unique];
  } catch {
    return staticEntries;
  }
}

/** Repair pages (MONEY PAGES) */
export async function getRepairEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  const repairs = Object.keys(REPAIRS);
  const staticEntries: SitemapEntry[] = repairs.map((slug) => ({
    loc: `${BASE_URL}/fix/${slug}`,
    lastmod: now,
    changefreq: "weekly",
    priority: 1.0,
  }));

  try {
    const pages = await sql`
      SELECT slug, created_at FROM pages
      WHERE quality_status = 'published' AND quality_score >= 70 AND slug LIKE 'fix/%'
        AND (canonical_slug IS NULL OR canonical_slug = slug)
      LIMIT 50000
    `;
    const dbEntries: SitemapEntry[] = (pages as any[]).map((p) => ({
      loc: `${BASE_URL}/${p.slug}`,
      lastmod: toLastmod(new Date(p.created_at || Date.now())),
      changefreq: "weekly",
      priority: 1.0,
    }));
    const seen = new Set(staticEntries.map((e) => e.loc));
    const unique = dbEntries.filter((e) => !seen.has(e.loc));
    return [...staticEntries, ...unique];
  } catch {
    return staticEntries;
  }
}

/** Component pages */
export async function getComponentEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  const components = [
    "compressor",
    "evaporator-coil",
    "condenser",
    "thermostat",
    "control-board",
    "blower-motor",
    "capacitor",
    "contactor",
    "drain-line",
    "filter",
    "heat-exchanger",
    "igniter",
    "flame-sensor",
    "ductwork",
    "reversing-valve",
    "defrost-board",
  ];
  const staticEntries: SitemapEntry[] = components.map((slug) => ({
    loc: `${BASE_URL}/components/${slug}`,
    lastmod: now,
    changefreq: "monthly",
    priority: 0.5,
  }));

  try {
    const pages = await sql`
      SELECT slug, created_at FROM pages
      WHERE quality_status = 'published' AND quality_score >= 70 AND slug LIKE 'components/%'
        AND (canonical_slug IS NULL OR canonical_slug = slug)
      LIMIT 50000
    `;
    const dbEntries: SitemapEntry[] = (pages as any[]).map((p) => ({
      loc: `${BASE_URL}/${p.slug}`,
      lastmod: toLastmod(new Date(p.created_at || Date.now())),
      changefreq: "monthly",
      priority: 0.5,
    }));
    const seen = new Set(staticEntries.map((e) => e.loc));
    const unique = dbEntries.filter((e) => !seen.has(e.loc));
    return [...staticEntries, ...unique];
  } catch {
    return staticEntries;
  }
}

/** Local service pages: /repair/{city}/{symptom} */
export async function getLocalEntries(): Promise<SitemapEntry[]> {
  try {
    const pages = await sql`
      SELECT slug, created_at FROM pages
      WHERE quality_status = 'published' AND quality_score >= 70 AND slug LIKE 'repair/%'
        AND (canonical_slug IS NULL OR canonical_slug = slug)
      LIMIT 100000
    `;
    if (!pages || (pages as any[]).length === 0) {
      // Fallback: generate from CITIES × top symptoms
      const topCities = CITIES.slice(0, 50);
      const topSymptoms = SYMPTOMS.slice(0, 20).map((s) => s.id);
      const now = toLastmod(new Date());
      const entries: SitemapEntry[] = [];
      for (const city of topCities) {
        for (const symptom of topSymptoms) {
          entries.push({
            loc: `${BASE_URL}/repair/${city.slug}/${symptom}`,
            lastmod: now,
            changefreq: "weekly",
            priority: 0.9,
          });
        }
      }
      return entries;
    }
    const now = toLastmod(new Date());
    return (pages as any[]).map((p) => ({
      loc: `${BASE_URL}/${p.slug}`,
      lastmod: toLastmod(new Date(p.created_at || now)),
      changefreq: "weekly",
      priority: 0.9,
    }));
  } catch {
    const now = toLastmod(new Date());
    const topCities = CITIES.slice(0, 50);
    const topSymptoms = SYMPTOMS.slice(0, 20).map((s) => s.id);
    const entries: SitemapEntry[] = [];
    for (const city of topCities) {
      for (const symptom of topSymptoms) {
        entries.push({
          loc: `${BASE_URL}/repair/${city.slug}/${symptom}`,
          lastmod: now,
          changefreq: "weekly",
          priority: 0.9,
        });
      }
    }
    return entries;
  }
}

/** Chunk entries into groups of CHUNK_SIZE */
export function chunkEntries(entries: SitemapEntry[]): SitemapEntry[][] {
  const chunks: SitemapEntry[][] = [];
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    chunks.push(entries.slice(i, i + CHUNK_SIZE));
  }
  return chunks.length ? chunks : [[]];
}

/** Generate URL set XML */
export function toUrlSetXml(entries: SitemapEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>${
      e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : ""
    }${e.priority !== undefined ? `\n    <priority>${e.priority.toFixed(1)}</priority>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`;
}

/** Generate sitemap index XML */
export function toSitemapIndexXml(sitemaps: { loc: string; lastmod: string }[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (s) => `  <sitemap>
    <loc>${escapeXml(s.loc)}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;
}
