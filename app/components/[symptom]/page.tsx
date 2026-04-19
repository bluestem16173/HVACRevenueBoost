import ComponentPageTemplate, { ComponentSchema } from "@/templates/component-page";
import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { strictRobotsForDbPage } from "@/lib/seo/strict-indexing";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { symptom: string } }): Promise<Metadata> {
  const page = await getDiagnosticPageFromDB(params.symptom, 'component');
  
  if (!page || !page.content_json) {
    return { title: "Component Service | HVAC Revenue Boost" };
  }

  const data = page.content_json as ComponentSchema;
  const qualityOk = page.quality_status !== "noindex";
  const strict = strictRobotsForDbPage(qualityOk, page.updated_at);

  return {
    title: data.seo?.metaTitle || data.title || "Component Diagnostic & Repair",
    description: data.seo?.metaDescription || data.hook || "Expert HVAC component troubleshooting and replacement.",
    ...(strict ?? {
      robots: qualityOk ? { index: true, follow: true } : { index: false, follow: true },
    }),
  };
}

export default async function ComponentRoute({ params }: { params: { symptom: string } }) {
  const aiPage = await getDiagnosticPageFromDB(params.symptom, 'component');

  if (!aiPage || !aiPage.content_json || aiPage.quality_status === "needs_regen") {
    notFound();
  }

  // Cast JSON fallback gracefully
  const data = aiPage.content_json as unknown as ComponentSchema;

  return <ComponentPageTemplate data={data} />;
}
