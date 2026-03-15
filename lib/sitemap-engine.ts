/**
 * Phase 16: Layered Sitemap Engine
 * Supports 100k+ URLs with chunked sitemaps (≤5000 URLs per file).
 * Master index → Layer indexes → Chunked sitemaps.
 */

import sql from "@/lib/db";
import { CLUSTERS } from "@/lib/clusters";
import { CONDITIONS } from "@/lib/conditions";
import { SYMPTOMS, CAUSES, REPAIRS } from "@/data/knowledge-graph";
import { CITIES } from "@/data/knowledge-graph";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://hvacrevenueboost.com";
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

/** Static + pillar routes */
export function getStaticEntries(): SitemapEntry[] {
  const now = toLastmod(new Date());
  const routes = [
    "",
    "/repair",
    "/diagnose",
    "/hvac",
    "/hvac-air-conditioning",
    "/hvac-heating-systems",
    "/hvac-airflow-ductwork",
    "/hvac-electrical-controls",
    "/hvac-thermostats-controls",
    "/hvac-maintenance",
  ];
  return routes.map((r) => ({
    loc: `${BASE_URL}${r}`,
    lastmod: now,
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
    }));
  } catch {
    return [
      { loc: `${BASE_URL}/system/residential-ac`, lastmod: now },
      { loc: `${BASE_URL}/system/rv-ac`, lastmod: now },
      { loc: `${BASE_URL}/system/mini-split`, lastmod: now },
      { loc: `${BASE_URL}/system/rooftop-hvac`, lastmod: now },
    ];
  }
}

/** Diagnostics (DecisionGrid wizard) */
export async function getDiagnosticEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  try {
    const rows = await sql`SELECT slug FROM diagnostics`;
    return (rows as any[]).map((r) => ({
      loc: `${BASE_URL}/diagnostic/${r.slug}`,
      lastmod: now,
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
    }));
    if (fromDb.length > 0) return fromDb;
  } catch {}
  return CITIES.map((c) => ({
    loc: `${BASE_URL}/repair/${c.slug}`,
    lastmod: now,
  }));
}

/** Cluster pages */
export function getClusterEntries(): SitemapEntry[] {
  const now = toLastmod(new Date());
  return CLUSTERS.map((c) => ({
    loc: `${BASE_URL}/cluster/${c.slug}`,
    lastmod: now,
  }));
}

/** Symptom pages from static + DB */
export async function getSymptomEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  const staticEntries: SitemapEntry[] = SYMPTOMS.map((s) => ({
    loc: `${BASE_URL}/diagnose/${s.id}`,
    lastmod: now,
  }));

  try {
    const pages = await sql`
      SELECT slug, created_at FROM pages
      WHERE status = 'published' AND slug LIKE 'diagnose/%'
      LIMIT 50000
    `;
    const dbEntries: SitemapEntry[] = (pages as any[]).map((p) => ({
      loc: `${BASE_URL}/${p.slug}`,
      lastmod: toLastmod(new Date(p.created_at || Date.now())),
    }));
    const seen = new Set(staticEntries.map((e) => e.loc));
    const unique = dbEntries.filter((e) => !seen.has(e.loc));
    return [...staticEntries, ...unique];
  } catch {
    return staticEntries;
  }
}

/** Condition pages */
export function getConditionEntries(): SitemapEntry[] {
  const now = toLastmod(new Date());
  return CONDITIONS.map((c) => ({
    loc: `${BASE_URL}/conditions/${c.slug}`,
    lastmod: now,
  }));
}

/** Cause pages - from knowledge graph + DB */
export async function getCauseEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  const causes = Object.keys(CAUSES);
  const staticEntries: SitemapEntry[] = causes.map((slug) => ({
    loc: `${BASE_URL}/cause/${slug}`,
    lastmod: now,
  }));

  try {
    const pages = await sql`
      SELECT slug, created_at FROM pages
      WHERE status = 'published' AND slug LIKE 'cause/%'
      LIMIT 50000
    `;
    const dbEntries: SitemapEntry[] = (pages as any[]).map((p) => ({
      loc: `${BASE_URL}/${p.slug}`,
      lastmod: toLastmod(new Date(p.created_at || Date.now())),
    }));
    const seen = new Set(staticEntries.map((e) => e.loc));
    const unique = dbEntries.filter((e) => !seen.has(e.loc));
    return [...staticEntries, ...unique];
  } catch {
    return staticEntries;
  }
}

/** Repair pages */
export async function getRepairEntries(): Promise<SitemapEntry[]> {
  const now = toLastmod(new Date());
  const repairs = Object.keys(REPAIRS);
  const staticEntries: SitemapEntry[] = repairs.map((slug) => ({
    loc: `${BASE_URL}/fix/${slug}`,
    lastmod: now,
  }));

  try {
    const pages = await sql`
      SELECT slug, created_at FROM pages
      WHERE status = 'published' AND slug LIKE 'fix/%'
      LIMIT 50000
    `;
    const dbEntries: SitemapEntry[] = (pages as any[]).map((p) => ({
      loc: `${BASE_URL}/${p.slug}`,
      lastmod: toLastmod(new Date(p.created_at || Date.now())),
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
  }));

  try {
    const pages = await sql`
      SELECT slug, created_at FROM pages
      WHERE status = 'published' AND slug LIKE 'components/%'
      LIMIT 50000
    `;
    const dbEntries: SitemapEntry[] = (pages as any[]).map((p) => ({
      loc: `${BASE_URL}/${p.slug}`,
      lastmod: toLastmod(new Date(p.created_at || Date.now())),
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
      WHERE status = 'published' AND slug LIKE 'repair/%'
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
          });
        }
      }
      return entries;
    }
    const now = toLastmod(new Date());
    return (pages as any[]).map((p) => ({
      loc: `${BASE_URL}/${p.slug}`,
      lastmod: toLastmod(new Date(p.created_at || now)),
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
    <lastmod>${e.lastmod}</lastmod>
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
