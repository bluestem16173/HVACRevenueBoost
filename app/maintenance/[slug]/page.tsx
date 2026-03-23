import MaintenancePageTemplate, { MaintenanceSchema } from "@/templates/maintenance-page";
import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await getDiagnosticPageFromDB(params.slug, 'maintenance');
  
  if (!page || !page.content_json) {
    return { title: "HVAC Maintenance | HVAC Revenue Boost" };
  }

  const data = page.content_json as MaintenanceSchema;
  
  return {
    title: data.title || "HVAC Diagnostic & Maintenance",
    description: data.hook || "Expert HVAC tune-ups and preventative maintenance.",
    robots: page.quality_status === 'noindex' ? { index: false, follow: true } : { index: true, follow: true }
  };
}

export default async function MaintenanceRoute({ params }: { params: { slug: string } }) {
  const aiPage = await getDiagnosticPageFromDB(params.slug, 'maintenance');

  if (!aiPage || !aiPage.content_json || aiPage.quality_status === "needs_regen") {
    notFound();
  }

  // Cast JSON fallback gracefully
  const data = aiPage.content_json as unknown as MaintenanceSchema;

  return <MaintenancePageTemplate data={data} />;
}
