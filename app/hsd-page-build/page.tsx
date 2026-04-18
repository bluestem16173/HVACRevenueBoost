import Link from "next/link";
import {
  DEMO_TYPES,
  HSD_PAGE_BUILD_LOCKED_TYPE,
} from "@/lib/hsd-page-build/fixtures";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HSD page build — locked QA previews",
  robots: { index: false, follow: false },
  description:
    "Home Service Diagnostics page-build previews: locked canonical build plus static fixtures (no DB).",
};

const LABELS: Record<string, string> = {
  "symptom-v5": "v5_master / DiagnosticGoldPage",
  "v2-goldstandard": "v2_goldstandard / GoldStandardPage",
  "authority-symptom": "authority_symptom / AuthoritySymptomPage",
  "decisiongrid-master": "decisiongrid_master / MasterDecisionGridPage",
  "city-service": "city_service / HybridServicePageTemplate",
  "city-symptom": "city_symptom / MasterDecisionGridPage (HSD locked)",
  emergency: "emergency / EmergencyPageTemplate",
};

export default function HSDPageBuildIndex() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 font-sans text-slate-800">
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-xs font-bold tracking-wide text-amber-700 uppercase">
          HSD · Home Service Diagnostics · page build QA
        </p>
        <h1 className="mb-2 text-3xl font-black text-slate-900">HSDPageBuild</h1>
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Locked build:</strong>{" "}
          <Link href={`/hsd-page-build/${HSD_PAGE_BUILD_LOCKED_TYPE}`} className="font-mono text-hvac-blue underline">
            {HSD_PAGE_BUILD_LOCKED_TYPE}
          </Link>{" "}
          — canonical HSD city diagnostic preview. Other types below are unlocked for template regression checks.
        </p>
        <p className="mb-8 text-slate-600">
          Static fixtures render the same components as production routes. Use this to verify expansion and templates
          before enqueueing real slugs.
        </p>
        <ul className="space-y-3">
          {DEMO_TYPES.map((id) => (
            <li key={id}>
              <Link
                href={`/hsd-page-build/${id}`}
                className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm transition hover:border-hvac-blue hover:shadow-md md:flex-row md:items-center md:justify-between ${
                  id === HSD_PAGE_BUILD_LOCKED_TYPE
                    ? "border-amber-400 ring-1 ring-amber-200"
                    : "border-slate-200"
                }`}
              >
                <span className="font-mono font-bold text-hvac-blue">
                  {id}
                  {id === HSD_PAGE_BUILD_LOCKED_TYPE ? (
                    <span className="ml-2 text-xs font-black uppercase text-amber-800">locked</span>
                  ) : null}
                </span>
                <span className="text-sm text-slate-600">{LABELS[id] ?? id}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
