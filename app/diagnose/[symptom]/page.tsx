import React from "react";
import { notFound } from "next/navigation";
import { DiagnosticPageView } from "@/components/DiagnosticPageView";
import { getIndexablePageBySlug } from "@/lib/get-indexable-page";

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
  const page = await getIndexablePageBySlug(params.symptom);

  if (!page) {
    return notFound();
  }

  console.log("DIAG PAGE DEBUG", {
    slug: (page as { slug?: string }).slug,
    hasHtml: !!(page as { content_html?: string }).content_html,
    htmlLength: (page as { content_html?: string }).content_html?.length ?? 0,
    hasJson: !!(page as { content_json?: unknown }).content_json,
  });

  return <DiagnosticPageView page={page as any} />;
}
