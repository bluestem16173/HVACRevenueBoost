import React from "react";
import sql from "@/lib/db";
import { notFound } from "next/navigation";
import { isIndexable } from "@/lib/slug-utils";
import DiagnosticModal from "@/components/DiagnosticModal";
import { RelatedLinks } from "@/components/RelatedLinks";
import { StickyCTA } from "@/components/StickyCTA";
import { LegacyRenderer } from "@/components/LegacyRenderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { symptom: string };
}) {
  const title = params.symptom.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `${title} | HVAC Troubleshooting & Fixes`,
    description: `Diagnose and fix your ${title.toLowerCase()} HVAC issue before it becomes an expensive repair. Fast, actionable guides for homeowners.`,
  };
}

export default async function SymptomPage({
  params,
}: {
  params: { symptom: string };
}) {
  let query;
  try {
    query = await sql`SELECT * FROM pages WHERE slug = ${params.symptom} LIMIT 1`;
  } catch (e) {
    console.error("DB ERROR:", e);
    return <div>DB connection failed</div>;
  }

  if (!query || query.length === 0) {
    return notFound();
  }
  
  const page = query[0] as any;

  if (!isIndexable(page)) {
    return notFound();
  }

  console.log('DIAG PAGE DEBUG', {
    slug: page.slug,
    hasHtml: !!page.content_html,
    htmlLength: page.content_html?.length ?? 0,
    hasJson: !!page.content_json,
  });

  // 1) HTML First Routing
  if (page.content_html && page.content_html.trim()) {
    // Strip old embedded sticky banners to prevent double-stacking with StickyCTA
    const cleanHtml = page.content_html.replace(/<div[^>]*position:\s*sticky[^>]*>[\s\S]*?<\/div>/i, '');
    
    return (
      <>
        <StickyCTA />
        <main style={{ padding: 24, paddingBottom: 60 }}>
          <DiagnosticModal />
          <article dangerouslySetInnerHTML={{ __html: cleanHtml || '' }} />
          <RelatedLinks slugs={['ac-not-cooling', 'ac-running-but-not-cooling', 'ac-weak-airflow', 'one-room-not-cooling']} />
        </main>
      </>
    );
  }

  // 2) JSON / Legacy Fallback Routing
  if (page.content_json) {
    const parsedJson = typeof page.content_json === "string" ? JSON.parse(page.content_json) : page.content_json;
    const fallbackTitle = params.symptom.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    
    return (
      <>
        <StickyCTA />
        <main style={{ padding: 24, paddingBottom: 60 }}>
          <DiagnosticModal />
          <LegacyRenderer title={fallbackTitle} data={parsedJson} />
          <RelatedLinks slugs={['ac-not-cooling', 'ac-running-but-not-cooling', 'ac-weak-airflow', 'one-room-not-cooling']} />
        </main>
      </>
    );
  }

  return <div>Empty page</div>;
}
