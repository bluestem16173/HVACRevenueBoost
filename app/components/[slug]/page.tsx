import ComponentPageTemplate, { ComponentSchema } from "@/templates/component-page";
import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await getDiagnosticPageFromDB(params.slug, 'component');
  
  if (!page || !page.content_json) {
    return { title: "Component Service | HVAC Revenue Boost" };
  }

  const data = page.content_json as ComponentSchema;
  
  return {
    title: data.seo?.metaTitle || data.title || "Component Diagnostic & Repair",
    description: data.seo?.metaDescription || data.hook || "Expert HVAC component troubleshooting and replacement.",
    robots: page.quality_status === 'noindex' ? { index: false, follow: true } : { index: true, follow: true }
  };
}

export default async function ComponentRoute({ params }: { params: { slug: string } }) {
  const aiPage = await getDiagnosticPageFromDB(params.slug, 'component');

  if (!aiPage || !aiPage.content_json || aiPage.quality_status === "needs_regen") {
    notFound();
  }

  // Cast JSON fallback gracefully
  const data = aiPage.content_json as unknown as ComponentSchema;

  return <ComponentPageTemplate data={data} />;
}
