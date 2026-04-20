import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DiagnosticPageView } from "@/components/DiagnosticPageView";
import { DiagnosticVerticalNav } from "@/components/diagnostic-hub/DiagnosticVerticalNav";
import { getIndexablePageBySlug, getPageBySlug } from "@/lib/get-indexable-page";
import { siteCanonicalUrl } from "@/lib/seo/canonical";
import { isIndexableProblemPillar } from "@/lib/seo/indexable-pillars";
import { RenderAuthority } from "@/components/RenderAuthority";

/** DB-backed symptom pages: always read fresh `pages` rows (same DATABASE_URL as workers). */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: { symptom: string } }): Promise<Metadata> {
  const segment = params.symptom;
  const titlePart = segment.replace(/-/g, " ");
  const pathname = `/plumbing/${segment}`;
  const storageSlug = `plumbing/${segment}`.toLowerCase();
  const dbPillar = await getPageBySlug(storageSlug);
  if (dbPillar) {
    const title = String((dbPillar as { title?: string | null }).title ?? "").trim();
    return {
      title: title || `${titlePart} | Plumbing diagnostic`,
      description: `National plumbing overview for ${titlePart}. Pick a city for the localized guide.`,
      alternates: { canonical: siteCanonicalUrl(pathname) },
      robots: { index: true, follow: true },
    };
  }
  const indexable = isIndexableProblemPillar("plumbing", segment);
  return {
    title: `${titlePart} | Plumbing diagnostic`,
    description: `National plumbing overview for ${titlePart}. Pick a city for the localized guide.`,
    ...(indexable
      ? {
          alternates: { canonical: siteCanonicalUrl(pathname) },
          robots: { index: true, follow: true },
        }
      : { robots: { index: false, follow: true } }),
  };
}

export default async function PlumbingSymptomPage({ params }: { params: { symptom: string } }) {
  const segment = params.symptom;
  const slug = `plumbing/${segment}`.toLowerCase();
  const dbPillar = await getPageBySlug(slug);
  if (dbPillar != null && (dbPillar as { content_json?: unknown }).content_json != null) {
    return <RenderAuthority content={(dbPillar as { content_json: unknown }).content_json} vertical="plumbing" />;
  }

  let page = await getIndexablePageBySlug(slug);
  if (!page) page = await getIndexablePageBySlug(segment);
  if (!page) page = await getIndexablePageBySlug(`diagnose/${segment}`);
  if (page) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 pt-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-hvac-blue">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/plumbing" className="hover:text-hvac-blue">
            Plumbing
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {(page as { title?: string | null }).title || segment.replace(/-/g, " ")}
          </span>
        </nav>
        <p className="mx-auto max-w-4xl px-4 pb-2 text-xs text-slate-500">
          Localized guides: pick a city from the{" "}
          <Link href="/plumbing" className="text-hvac-blue hover:underline">
            Plumbing hub
          </Link>{" "}
          or append <span className="font-mono">/{`{city}`}</span> to this URL.
        </p>
        <div className="mx-auto max-w-4xl px-4">
          <DiagnosticVerticalNav vertical="plumbing" pillarSlug={segment} citySlug={null} />
        </div>
        <DiagnosticPageView page={page as any} localLabel={null} relatedVertical="plumbing" />
      </div>
    );
  }
  notFound();
}
