import type { Metadata } from "next";
import Link from "next/link";
import { DgStructuredAuthorityArticle } from "@/components/dg/DgStructuredAuthorityArticle";
import {
  DG_STRUCTURED_PREVIEW_PAGES,
  type DgStructuredPreviewPage,
} from "@/lib/dg-authority-structured-preview/fixtures";

const HVAC_NATIONAL_PREVIEW_SLUGS = [
  "hvac-ac-not-cooling",
  "hvac-weak-airflow",
  "hvac-frozen-evaporator-coil",
] as const;

function hvacNationalPreviewPages(): DgStructuredPreviewPage[] {
  return HVAC_NATIONAL_PREVIEW_SLUGS.map((slug) => {
    const p = DG_STRUCTURED_PREVIEW_PAGES.find((x) => x.slug === slug);
    if (!p) throw new Error(`Missing structured preview fixture: ${slug}`);
    return p;
  });
}

export const metadata: Metadata = {
  title: "DG Authority structured — HVAC national (3)",
  description:
    "Renders three national HVAC dg_authority_v3 demos (AC not cooling, weak airflow, frozen coil). Demo only — not read from pages.",
};

export default function DgAuthorityStructuredPreviewPage() {
  const pages = hvacNationalPreviewPages();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
          <Link href="/" className="text-sm font-medium text-hvac-blue hover:underline">
            ← Home
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 md:text-3xl">DG Authority structured preview</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Three national HVAC symptom pages (<code className="rounded bg-slate-100 px-1">dg_authority_v3</code>
              ). Demo JSON only — not read from <code className="rounded bg-slate-100 px-1">pages</code>.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            {pages.map((p) => (
              <a
                key={p.slug}
                href={`#${p.slug}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:border-hvac-blue hover:text-hvac-blue"
              >
                {p.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {pages.map((p) => (
        <section
          key={p.slug}
          id={p.slug}
          className="border-b border-slate-200 bg-white odd:bg-slate-50/50"
        >
          <DgStructuredAuthorityArticle data={p.data} vertical={p.vertical} />
        </section>
      ))}
    </div>
  );
}
