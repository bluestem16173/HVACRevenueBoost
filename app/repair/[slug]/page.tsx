import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import GoldStandardPage from "@/components/gold/GoldStandardPage";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getPageWithRetry(slug: string, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const aiPage = await getDiagnosticPageFromDB(slug, 'repair')
      ?? await getDiagnosticPageFromDB(slug, 'diagnostic')
      ?? await getDiagnosticPageFromDB(slug, 'symptom');

    if (aiPage) {
      return aiPage;
    }
    await new Promise(r => setTimeout(r, 150));
  }
  return null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const aiPage = await getPageWithRetry("repair/" + params.slug);
  if (aiPage?.quality_status === 'noindex') {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

export default async function RepairPage({ params }: { params: { slug: string } }) {
  const aiPage = await getPageWithRetry("repair/" + params.slug);
  
  if (!aiPage || !['repair', 'symptom', 'diagnostic'].includes(aiPage.page_type)) {
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
      rawContent.slug = params.slug;
    }
    return <GoldStandardPage data={rawContent as any} />;
  }

  notFound();
}
