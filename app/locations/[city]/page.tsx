import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import GoldStandardPage from "@/components/gold/GoldStandardPage";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getPageWithRetry(city: string, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const aiPage = await getDiagnosticPageFromDB(city, 'locations')
      ?? await getDiagnosticPageFromDB(city, 'diagnostic')
      ?? await getDiagnosticPageFromDB(city, 'symptom');

    if (aiPage) {
      return aiPage;
    }
    await new Promise(r => setTimeout(r, 150));
  }
  return null;
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const aiPage = await getPageWithRetry("locations/" + params.city);
  if (aiPage?.quality_status === 'noindex') {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

export default async function LocationPage({ params }: { params: { city: string } }) {
  const aiPage = await getPageWithRetry("locations/" + params.city);
  
  if (!aiPage || !['locations', 'location', 'symptom', 'diagnostic'].includes(aiPage.page_type)) {
    notFound();
  }

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
    if (rawContent?.schemaVersion !== "v1") {
      notFound();
    }
    if (rawContent) {
      rawContent.slug = params.city;
    }
    return <GoldStandardPage data={rawContent as any} />;
  }

  notFound();
}
