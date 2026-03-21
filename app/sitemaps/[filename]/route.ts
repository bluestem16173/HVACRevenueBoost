/**
 * Phase 16: Layer-specific sitemaps
 * Handles: static, clusters-index, clusters-1, symptoms-index, symptoms-1..N,
 * conditions-index, conditions-1..N, causes-index, causes-1..N, repairs-index,
 * repairs-1..N, components-index, components-1..N, local-index, local-1..N
 */
import { NextResponse } from "next/server";
import {
  getStaticEntries,
  getSystemEntries,
  getClusterEntries,
  getSymptomEntries,
  getConditionEntries,
  getDiagnosticEntries,
  getCauseEntries,
  getRepairEntries,
  getComponentEntries,
  getCityEntries,
  getLocalEntries,
  chunkEntries,
  toUrlSetXml,
  toSitemapIndexXml,
} from "@/lib/sitemap-engine";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://hvacrevenueboost.com";

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: { filename: string } }
) {
  const filename = (params.filename || "").replace(/\.xml$/, "");
  const now = new Date().toISOString().split("T")[0];

  try {
    // Static (single file)
    if (filename === "static") {
      const entries = getStaticEntries();
      const xml = toUrlSetXml(entries);
      return xmlResponse(xml);
    }

    // Systems (DecisionGrid)
    if (filename === "systems-index") {
      const entries = await getSystemEntries();
      const chunks = chunkEntries(entries);
      const sitemaps = chunks.map((_, i) => ({
        loc: `${BASE_URL}/sitemaps/systems-${i + 1}.xml`,
        lastmod: now,
      }));
      const xml = chunks.length <= 1 ? toUrlSetXml(entries) : toSitemapIndexXml(sitemaps);
      return xmlResponse(xml);
    }
    if (filename.startsWith("systems-")) {
      const idx = parseInt(filename.replace("systems-", "").replace(".xml", ""), 10);
      const entries = await getSystemEntries();
      const chunks = chunkEntries(entries);
      const chunk = chunks[idx - 1] || [];
      return xmlResponse(toUrlSetXml(chunk));
    }

    // Diagnostics (DecisionGrid wizard)
    if (filename === "diagnostics-index") {
      const entries = await getDiagnosticEntries();
      const chunks = chunkEntries(entries);
      const sitemaps = chunks.map((_, i) => ({
        loc: `${BASE_URL}/sitemaps/diagnostics-${i + 1}.xml`,
        lastmod: now,
      }));
      const xml = chunks.length <= 1 ? toUrlSetXml(entries) : toSitemapIndexXml(sitemaps);
      return xmlResponse(xml);
    }
    if (filename.startsWith("diagnostics-")) {
      const idx = parseInt(filename.replace("diagnostics-", "").replace(".xml", ""), 10);
      const entries = await getDiagnosticEntries();
      const chunks = chunkEntries(entries);
      const chunk = chunks[idx - 1] || [];
      return xmlResponse(toUrlSetXml(chunk));
    }

    // Cities
    if (filename === "cities-index") {
      const entries = await getCityEntries();
      const chunks = chunkEntries(entries);
      const sitemaps = chunks.map((_, i) => ({
        loc: `${BASE_URL}/sitemaps/cities-${i + 1}.xml`,
        lastmod: now,
      }));
      const xml = chunks.length <= 1 ? toUrlSetXml(entries) : toSitemapIndexXml(sitemaps);
      return xmlResponse(xml);
    }
    if (filename.startsWith("cities-")) {
      const idx = parseInt(filename.replace("cities-", "").replace(".xml", ""), 10);
      const entries = await getCityEntries();
      const chunks = chunkEntries(entries);
      const chunk = chunks[idx - 1] || [];
      return xmlResponse(toUrlSetXml(chunk));
    }

    // Clusters (single file, no index needed - but we use clusters-index for consistency)
    if (filename === "clusters-index") {
      const entries = getClusterEntries();
      const chunks = chunkEntries(entries);
      const sitemaps = chunks.map((_, i) => ({
        loc: `${BASE_URL}/sitemaps/clusters-${i + 1}.xml`,
        lastmod: now,
      }));
      const xml = chunks.length <= 1 ? toUrlSetXml(entries) : toSitemapIndexXml(sitemaps);
      return xmlResponse(xml);
    }
    if (filename.startsWith("clusters-")) {
      const idx = parseInt(filename.replace("clusters-", "").replace(".xml", ""), 10);
      const entries = getClusterEntries();
      const chunks = chunkEntries(entries);
      const chunk = chunks[idx - 1] || [];
      return xmlResponse(toUrlSetXml(chunk));
    }

    // Symptoms
    if (filename === "symptoms-index") {
      const entries = await getSymptomEntries();
      const chunks = chunkEntries(entries);
      const sitemaps = chunks.map((_, i) => ({
        loc: `${BASE_URL}/sitemaps/symptoms-${i + 1}.xml`,
        lastmod: now,
      }));
      const xml = chunks.length <= 1 ? toUrlSetXml(entries) : toSitemapIndexXml(sitemaps);
      return xmlResponse(xml);
    }
    if (filename.startsWith("symptoms-")) {
      const idx = parseInt(filename.replace("symptoms-", "").replace(".xml", ""), 10);
      const entries = await getSymptomEntries();
      const chunks = chunkEntries(entries);
      const chunk = chunks[idx - 1] || [];
      return xmlResponse(toUrlSetXml(chunk));
    }

    // Conditions
    if (filename === "conditions-index") {
      const entries = await getConditionEntries();
      const chunks = chunkEntries(entries);
      const sitemaps = chunks.map((_, i) => ({
        loc: `${BASE_URL}/sitemaps/conditions-${i + 1}.xml`,
        lastmod: now,
      }));
      const xml = chunks.length <= 1 ? toUrlSetXml(entries) : toSitemapIndexXml(sitemaps);
      return xmlResponse(xml);
    }
    if (filename.startsWith("conditions-")) {
      const idx = parseInt(filename.replace("conditions-", "").replace(".xml", ""), 10);
      const entries = await getConditionEntries();
      const chunks = chunkEntries(entries);
      const chunk = chunks[idx - 1] || [];
      return xmlResponse(toUrlSetXml(chunk));
    }

    // Causes
    if (filename === "causes-index") {
      const entries = await getCauseEntries();
      const chunks = chunkEntries(entries);
      const sitemaps = chunks.map((_, i) => ({
        loc: `${BASE_URL}/sitemaps/causes-${i + 1}.xml`,
        lastmod: now,
      }));
      const xml = chunks.length <= 1 ? toUrlSetXml(entries) : toSitemapIndexXml(sitemaps);
      return xmlResponse(xml);
    }
    if (filename.startsWith("causes-")) {
      const idx = parseInt(filename.replace("causes-", "").replace(".xml", ""), 10);
      const entries = await getCauseEntries();
      const chunks = chunkEntries(entries);
      const chunk = chunks[idx - 1] || [];
      return xmlResponse(toUrlSetXml(chunk));
    }

    // Repairs
    if (filename === "repairs-index") {
      const entries = await getRepairEntries();
      const chunks = chunkEntries(entries);
      const sitemaps = chunks.map((_, i) => ({
        loc: `${BASE_URL}/sitemaps/repairs-${i + 1}.xml`,
        lastmod: now,
      }));
      const xml = chunks.length <= 1 ? toUrlSetXml(entries) : toSitemapIndexXml(sitemaps);
      return xmlResponse(xml);
    }
    if (filename.startsWith("repairs-")) {
      const idx = parseInt(filename.replace("repairs-", "").replace(".xml", ""), 10);
      const entries = await getRepairEntries();
      const chunks = chunkEntries(entries);
      const chunk = chunks[idx - 1] || [];
      return xmlResponse(toUrlSetXml(chunk));
    }

    // Components
    if (filename === "components-index") {
      const entries = await getComponentEntries();
      const chunks = chunkEntries(entries);
      const sitemaps = chunks.map((_, i) => ({
        loc: `${BASE_URL}/sitemaps/components-${i + 1}.xml`,
        lastmod: now,
      }));
      const xml = chunks.length <= 1 ? toUrlSetXml(entries) : toSitemapIndexXml(sitemaps);
      return xmlResponse(xml);
    }
    if (filename.startsWith("components-")) {
      const idx = parseInt(filename.replace("components-", "").replace(".xml", ""), 10);
      const entries = await getComponentEntries();
      const chunks = chunkEntries(entries);
      const chunk = chunks[idx - 1] || [];
      return xmlResponse(toUrlSetXml(chunk));
    }

    // Local
    if (filename === "local-index") {
      const entries = await getLocalEntries();
      const chunks = chunkEntries(entries);
      const sitemaps = chunks.map((_, i) => ({
        loc: `${BASE_URL}/sitemaps/local-${i + 1}.xml`,
        lastmod: now,
      }));
      const xml = chunks.length <= 1 ? toUrlSetXml(entries) : toSitemapIndexXml(sitemaps);
      return xmlResponse(xml);
    }
    if (filename.startsWith("local-")) {
      const idx = parseInt(filename.replace("local-", "").replace(".xml", ""), 10);
      const entries = await getLocalEntries();
      const chunks = chunkEntries(entries);
      const chunk = chunks[idx - 1] || [];
      return xmlResponse(toUrlSetXml(chunk));
    }

    return new NextResponse("Not found", { status: 404 });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

function xmlResponse(xml: string) {
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
