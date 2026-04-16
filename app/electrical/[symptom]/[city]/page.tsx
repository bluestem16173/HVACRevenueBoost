import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DiagnosticPageView } from "@/components/DiagnosticPageView";
import { DiagnosticVerticalNav } from "@/components/diagnostic-hub/DiagnosticVerticalNav";
import { getIndexablePageForLocalizedRoute } from "@/lib/get-indexable-page";
import { buildElectricalLocalizedPillarPath, formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: { symptom: string; city: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const local = formatCityPathSegmentForDisplay(params.city);
  const titlePart = params.symptom.replace(/-/g, " ");
  return {
    title: `${titlePart} in ${local} | Electrical diagnostic`,
    description: `Localized electrical diagnostic guide for ${titlePart} in ${local}.`,
  };
}

export default async function ElectricalLocalizedPage({ params }: Props) {
  const page = await getIndexablePageForLocalizedRoute("electrical", params.symptom, params.city);
  if (!page) {
    notFound();
  }

  const localLabel = formatCityPathSegmentForDisplay(params.city);

  return (
    <div>
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 pt-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-hvac-blue">
          Home
        </Link>
        <span className="text-slate-300">/</span>
        <Link href="/electrical" className="hover:text-hvac-blue">
          Electrical
        </Link>
        <span className="text-slate-300">/</span>
        <Link href={`/electrical/${params.symptom}`} className="hover:text-hvac-blue">
          {params.symptom.replace(/-/g, " ")}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-800 dark:text-slate-200">{localLabel}</span>
      </nav>
      <p className="mx-auto max-w-4xl px-4 pb-2 text-xs text-slate-500">
        National pillar:{" "}
        <Link href={`/electrical/${params.symptom}`} className="text-hvac-blue hover:underline">
          /electrical/{params.symptom}
        </Link>
        {" · "}
        Local URL: <span className="font-mono">{buildElectricalLocalizedPillarPath(params.symptom, params.city)}</span>
      </p>
      <div className="mx-auto max-w-4xl px-4">
        <DiagnosticVerticalNav vertical="electrical" pillarSlug={params.symptom} citySlug={params.city} />
      </div>
      <DiagnosticPageView page={page as any} localLabel={localLabel} relatedVertical="electrical" />
    </div>
  );
}
