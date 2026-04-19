import CostPageTemplate, { CostSchema } from "@/templates/cost-page";
import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { strictRobotsForDbPage } from "@/lib/seo/strict-indexing";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { symptom: string } }): Promise<Metadata> {
  const page = await getDiagnosticPageFromDB(params.symptom, 'cost');
  
  if (!page || !page.content_json) {
    return { title: `${params.symptom.replace(/-/g, ' ')} Replacement Cost | HVAC Revenue Boost` };
  }

  const data = page.content_json as unknown as CostSchema;
  const qualityOk = page.quality_status !== "noindex";
  const strict = strictRobotsForDbPage(qualityOk, page.updated_at);

  return {
    title: data.title || `${data.repairOrPart} Replacement Cost Guide`,
    description: data.hook || `Find out exact pricing and labor costs for ${data.repairOrPart} replacement.`,
    ...(strict ?? {
      robots: qualityOk ? { index: true, follow: true } : { index: false, follow: true },
    }),
  };
}

export default async function CostRoute({ params }: { params: { symptom: string } }) {
  const aiPage = await getDiagnosticPageFromDB(params.symptom, 'cost');

  if (aiPage?.quality_status === "needs_regen") {
    notFound();
  }

  // Gracefully fallback to deterministic static build if DB record is empty/missing
  const data: CostSchema = (aiPage?.content_json as unknown as CostSchema) || {
    pageType: "cost",
    slug: params.symptom,
    repairOrPart: params.symptom.replace(/-/g, ' '),
    costRange: {
      low: "$150",
      high: "$800",
      average: "$350"
    },
    cta: {
      primary: "Get Free Estimates"
    }
  };

  return <CostPageTemplate data={data} />;
}
