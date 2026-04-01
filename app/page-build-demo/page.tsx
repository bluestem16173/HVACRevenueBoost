import Link from "next/link";
import { DEMO_TYPES } from "@/lib/page-build-demo/fixtures";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page build demos — 100KPageMaker",
  robots: { index: false, follow: false },
  description: "Preview each programmatic page type with static fixtures (no DB).",
};

const LABELS: Record<string, string> = {
  "symptom-v5": "v5_master / DiagnosticGoldPage",
  "v2-goldstandard": "v2_goldstandard / GoldStandardPage",
  "authority-symptom": "authority_symptom / AuthoritySymptomPage",
  "decisiongrid-master": "decisiongrid_master / MasterDecisionGridPage",
  "city-service": "city_service / HybridServicePageTemplate",
  "city-symptom": "city_symptom / MasterDecisionGridPage (HRB-shaped)",
  emergency: "emergency / EmergencyPageTemplate",
};

export default function PageBuildDemoIndex() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 font-sans text-slate-800">
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-xs font-bold tracking-wide text-amber-700 uppercase">100KPageMaker · programmatic QA</p>
        <h1 className="mb-2 text-3xl font-black text-slate-900">Page build — each type</h1>
        <p className="mb-8 text-slate-600">
          Static fixtures render the same components as production routes. Use this to verify expansion and templates before
          enqueueing real slugs.
        </p>
        <ul className="space-y-3">
          {DEMO_TYPES.map((id) => (
            <li key={id}>
              <Link
                href={`/page-build-demo/${id}`}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-hvac-blue hover:shadow-md md:flex-row md:items-center md:justify-between"
              >
                <span className="font-mono font-bold text-hvac-blue">{id}</span>
                <span className="text-sm text-slate-600">{LABELS[id] ?? id}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
