import Link from "next/link";
import { notFound } from "next/navigation";
import { DiagnosticPageView } from "@/components/DiagnosticPageView";
import { DiagnosticVerticalNav } from "@/components/diagnostic-hub/DiagnosticVerticalNav";
import { getIndexablePageBySlug } from "@/lib/get-indexable-page";

export const revalidate = 3600;
export const dynamicParams = true;

export default async function PlumbingSymptomPage({ params }: { params: { symptom: string } }) {
  const segment = params.symptom;
  const slug = `plumbing/${segment}`;
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
