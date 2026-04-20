import MaintenancePageTemplate, { MaintenanceSchema } from "@/templates/maintenance-page";
import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { robotsForDbBackedPage } from "@/lib/seo/strict-indexing";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { symptom: string } }): Promise<Metadata> {
  const page = await getDiagnosticPageFromDB(params.symptom, 'maintenance');
  
  if (!page || !page.content_json) {
    return { title: "HVAC Maintenance | HVAC Revenue Boost" };
  }

  const data = page.content_json as MaintenanceSchema;
  const qualityOk = page.quality_status !== "noindex";
  const strict = robotsForDbBackedPage(page, qualityOk);

  return {
    title: data.title || "HVAC Diagnostic & Maintenance",
    description: data.hook || "Expert HVAC tune-ups and preventative maintenance.",
    ...(strict ?? {
      robots: qualityOk ? { index: true, follow: true } : { index: false, follow: true },
    }),
  };
}

export default async function MaintenanceRoute({ params }: { params: { symptom: string } }) {
  const aiPage = await getDiagnosticPageFromDB(params.symptom, 'maintenance');

  if (!aiPage || !aiPage.content_json || aiPage.quality_status === "needs_regen") {
    notFound();
  }

  // Cast JSON fallback gracefully
  const data = aiPage.content_json as unknown as MaintenanceSchema;

  return <MaintenancePageTemplate data={data} />;
}
