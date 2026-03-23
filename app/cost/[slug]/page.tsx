import CostPageTemplate, { CostSchema } from "@/templates/cost-page";
import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await getDiagnosticPageFromDB(params.slug, 'cost');
  
  if (!page || !page.content_json) {
    return { title: `${params.slug.replace(/-/g, ' ')} Replacement Cost | HVAC Revenue Boost` };
  }

  const data = page.content_json as unknown as CostSchema;
  
  return {
    title: data.title || `${data.repairOrPart} Replacement Cost Guide`,
    description: data.hook || `Find out exact pricing and labor costs for ${data.repairOrPart} replacement.`,
    robots: page.quality_status === 'noindex' ? { index: false, follow: true } : { index: true, follow: true }
  };
}

export default async function CostRoute({ params }: { params: { slug: string } }) {
  const aiPage = await getDiagnosticPageFromDB(params.slug, 'cost');

  if (aiPage?.quality_status === "needs_regen") {
    notFound();
  }

  // Gracefully fallback to deterministic static build if DB record is empty/missing
  const data: CostSchema = (aiPage?.content_json as unknown as CostSchema) || {
    pageType: "cost",
    slug: params.slug,
    repairOrPart: params.slug.replace(/-/g, ' '),
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
