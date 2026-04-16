import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiagnosticPageView } from "@/components/DiagnosticPageView";
import { getIndexablePageForLocalizedRoute } from "@/lib/get-indexable-page";
import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: { symptom: string; city: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const local = formatCityPathSegmentForDisplay(params.city);
  const titlePart = params.symptom.replace(/-/g, " ");
  return {
    title: `${titlePart} in ${local} | HVAC diagnostic`,
    description: `Localized diagnostic guide for ${titlePart} in ${local}. Same technical playbook as the national pillar page.`,
  };
}

export default async function HvacLocalizedPillarPage({ params }: Props) {
  const page = await getIndexablePageForLocalizedRoute("hvac", params.symptom, params.city);
  if (!page) {
    notFound();
  }

  const localLabel = formatCityPathSegmentForDisplay(params.city);

  return (
    <DiagnosticPageView
      page={page as any}
      localLabel={localLabel}
      relatedVertical="hvac"
      localizedChrome={{
        vertical: "hvac",
        pillarSlug: params.symptom,
        citySlug: params.city,
        cityLabel: localLabel,
      }}
    />
  );
}
