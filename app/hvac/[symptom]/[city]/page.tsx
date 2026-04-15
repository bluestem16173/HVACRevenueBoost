import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DiagnosticPageView } from "@/components/DiagnosticPageView";
import { getIndexablePageBySlug } from "@/lib/get-indexable-page";
import { buildHvacLocalizedPillarPath, formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";

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
  const page = await getIndexablePageBySlug(params.symptom);
  if (!page) {
    notFound();
  }

  const localLabel = formatCityPathSegmentForDisplay(params.city);

  return (
    <div>
      <nav className="max-w-4xl mx-auto px-4 pt-6 text-sm text-slate-500 flex flex-wrap gap-2 items-center">
        <Link href="/" className="hover:text-hvac-blue">
          Home
        </Link>
        <span className="text-slate-300">/</span>
        <Link href="/hvac" className="hover:text-hvac-blue">
          HVAC
        </Link>
        <span className="text-slate-300">/</span>
        <Link href={`/diagnose/${params.symptom}`} className="hover:text-hvac-blue">
          {params.symptom.replace(/-/g, " ")}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium">{localLabel}</span>
      </nav>
      <p className="max-w-4xl mx-auto px-4 text-xs text-slate-500 -mt-2 pb-2">
        Canonical national guide:{" "}
        <Link href={`/diagnose/${params.symptom}`} className="text-hvac-blue hover:underline">
          /diagnose/{params.symptom}
        </Link>
        {" · "}
        Programmatic local URL:{" "}
        <span className="font-mono">{buildHvacLocalizedPillarPath(params.symptom, params.city)}</span>
      </p>
      <DiagnosticPageView page={page as any} localLabel={localLabel} />
    </div>
  );
}
