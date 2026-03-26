import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import GoldStandardPage from "@/components/gold/GoldStandardPage";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Soft Retry Proxy to handle Neon DB replica lag and race conditions.
 * Shields freshly generated pages from instantly 404ing while waiting for replica sync.
 */
async function getPageWithRetry(symptom: string, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const aiPage = await getDiagnosticPageFromDB(symptom, 'diagnose') 
      ?? await getDiagnosticPageFromDB(symptom, 'symptom')
      ?? await getDiagnosticPageFromDB(symptom, 'condition')
      ?? await getDiagnosticPageFromDB(symptom, 'system');

    if (aiPage) {
      return aiPage;
    }

    // Wait 150ms to allow replica sync
    await new Promise(r => setTimeout(r, 150));
  }
  return null;
}

export async function generateMetadata({ params }: { params: { symptom: string } }): Promise<Metadata> {
  const aiPage = await getPageWithRetry(params.symptom);
  if (aiPage?.quality_status === 'noindex') {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

export default async function SymptomPage({ params }: { params: { symptom: string } }) {
  const aiPage = await getPageWithRetry(params.symptom);
  
  if (!aiPage || !['symptom', 'diagnostic', 'condition'].includes(aiPage.page_type)) {
    notFound();
  }

  // FORCE LOGGING TO DISK
  const fs = require('fs');
  fs.appendFileSync('debug-render.txt', `\n[${new Date().toISOString()}] RENDERING SLUG: ${params.symptom} | schema_version: ${aiPage?.schema_version} | page_type: ${aiPage?.page_type}\n`);

  if (aiPage?.quality_status === "needs_regen") {
    notFound();
  }

  let rawContent: Record<string, unknown> | null = null;
  const pageContent = aiPage?.content_json ?? (aiPage as any)?.data;
  if (pageContent) {
    const raw = pageContent;
    rawContent = typeof raw === "string" ? (() => { try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; } })() : (raw as Record<string, unknown>);
  }

  if (aiPage?.schema_version === "v2_goldstandard") {
    // STRICT SCHEMA VERSION GATE:
    // Only accept fully formed v1 payloads. If a legacy payload somehow sneaks in under the v2_goldstandard flag, kill it.
    if (rawContent?.schemaVersion !== "v1") {
      notFound();
    }

    // Add raw slug to data so the page knows what to render in breadcrumbs if missing
    if (rawContent) {
      rawContent.slug = params.symptom;
    }
    return <GoldStandardPage data={rawContent as any} />;
  }

  // STRICT LOCK: Diagnostics route no longer supports legacy fallback templates.
  // If the schema_version is missing or the page is old string JSON, 404 the route immediately
  // to force the generation pipeline to properly regenerate it.
  notFound();
}
