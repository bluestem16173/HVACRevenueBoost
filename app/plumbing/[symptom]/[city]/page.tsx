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
    title: `${titlePart} in ${local} | Plumbing diagnostic`,
    description: `Localized plumbing diagnostic guide for ${titlePart} in ${local}.`,
  };
}

export default async function PlumbingLocalizedPage({ params }: Props) {
  const page = await getIndexablePageForLocalizedRoute("plumbing", params.symptom, params.city);
  if (!page) {
    notFound();
  }

  const localLabel = formatCityPathSegmentForDisplay(params.city);

  return (
    <DiagnosticPageView
      page={page as any}
      localLabel={localLabel}
      relatedVertical="plumbing"
      localizedChrome={{
        vertical: "plumbing",
        pillarSlug: params.symptom,
        citySlug: params.city,
        cityLabel: localLabel,
      }}
    />
  );
}
