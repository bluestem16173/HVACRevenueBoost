import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiagnosticPageView } from "@/components/DiagnosticPageView";
import { getIndexablePageForLocalizedRoute } from "@/lib/get-indexable-page";
import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";
import { siteCanonicalUrl } from "@/lib/seo/canonical";
import { robotsForDbBackedPage } from "@/lib/seo/strict-indexing";
import { isLocalizedTradeTripletEligibleForIndexingRobots } from "@/lib/seo/tier-one-discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: { symptom: string; city: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const local = formatCityPathSegmentForDisplay(params.city);
  const titlePart = params.symptom.replace(/-/g, " ");
  const page = await getIndexablePageForLocalizedRoute("electrical", params.symptom, params.city);
  const strict = robotsForDbBackedPage(
    page as { status?: unknown; updated_at?: unknown } | null,
    Boolean(page) && isLocalizedTradeTripletEligibleForIndexingRobots(page as { slug?: unknown }),
  );
  const pathname = `/electrical/${params.symptom}/${params.city}`;
  return {
    title: `${titlePart} in ${local} | Electrical diagnostic`,
    description: `Localized electrical diagnostic guide for ${titlePart} in ${local}.`,
    alternates: { canonical: siteCanonicalUrl(pathname) },
    ...(strict ?? { robots: { index: true, follow: true } }),
  };
}

export default async function ElectricalLocalizedPage({ params }: Props) {
  const page = await getIndexablePageForLocalizedRoute("electrical", params.symptom, params.city);
  if (!page) {
    notFound();
  }

  const localLabel = formatCityPathSegmentForDisplay(params.city);

  return (
    <DiagnosticPageView
      page={page as any}
      localLabel={localLabel}
      relatedVertical="electrical"
      localizedChrome={{
        vertical: "electrical",
        pillarSlug: params.symptom,
        citySlug: params.city,
        cityLabel: localLabel,
      }}
    />
  );
}
