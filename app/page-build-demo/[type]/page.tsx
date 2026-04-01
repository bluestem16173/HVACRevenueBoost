import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DiagnosticGoldPage from "@/components/diagnostic/DiagnosticGoldPage";
import GoldStandardPage from "@/components/gold/GoldStandardPage";
import AuthoritySymptomPage from "@/components/authority/AuthoritySymptomPage";
import MasterDecisionGridPage from "@/components/decisiongrid/MasterDecisionGridPage";
import HybridServicePageTemplate from "@/templates/hybrid-service-page";
import EmergencyPageTemplate from "@/templates/emergency-page";
import { normalizeDiagnosticToDisplayModel } from "@/lib/normalize-diagnostic-display";
import { normalizePageData } from "@/lib/content";
import {
  DEMO_TYPES,
  fixtureAuthoritySymptom,
  fixtureCityService,
  fixtureCitySymptom,
  fixtureDecisiongridMaster,
  fixtureEmergency,
  fixtureV2GoldStandard,
  fixtureV5Master,
  type DemoTypeId,
} from "@/lib/page-build-demo/fixtures";

export const dynamic = "force-static";

export function generateStaticParams() {
  return DEMO_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: { type: string };
}): Promise<Metadata> {
  return {
    title: `Demo: ${params.type} | Page build`,
    robots: { index: false, follow: false },
  };
}

function isDemoType(t: string): t is DemoTypeId {
  return (DEMO_TYPES as readonly string[]).includes(t);
}

export default function PageBuildDemoByType({ params }: { params: { type: string } }) {
  const { type } = params;
  if (!isDemoType(type)) notFound();

  switch (type) {
    case "symptom-v5": {
      const display = normalizeDiagnosticToDisplayModel(fixtureV5Master, { routeSlug: "page-build-demo-symptom-v5" });
      return (
        <div>
          <DemoBanner slug="symptom-v5" />
          <DiagnosticGoldPage display={display} routeSlug="page-build-demo-symptom-v5" />
        </div>
      );
    }
    case "v2-goldstandard":
      return (
        <div>
          <DemoBanner slug="v2-goldstandard" />
          <GoldStandardPage data={fixtureV2GoldStandard} />
        </div>
      );
    case "authority-symptom":
      return (
        <div>
          <DemoBanner slug="authority-symptom" />
          <AuthoritySymptomPage content={fixtureAuthoritySymptom} />
        </div>
      );
    case "decisiongrid-master": {
      const vm = normalizePageData({
        rawContent: fixtureDecisiongridMaster,
        pageType: "symptom",
        slug: "demo-decisiongrid",
        title: String(fixtureDecisiongridMaster.title ?? "Demo"),
      });
      return (
        <div>
          <DemoBanner slug="decisiongrid-master" />
          <MasterDecisionGridPage pageViewModel={vm} rawContent={fixtureDecisiongridMaster} />
        </div>
      );
    }
    case "city-service":
      return (
        <div>
          <DemoBanner slug="city-service" />
          <HybridServicePageTemplate data={fixtureCityService} phoneNumber="(555) 555-0100" />
        </div>
      );
    case "city-symptom": {
      const vm = normalizePageData({
        rawContent: fixtureCitySymptom,
        pageType: "symptom",
        slug: "demo-city-symptom",
        title: String(fixtureCitySymptom.title ?? "Demo"),
      });
      return (
        <div>
          <DemoBanner slug="city-symptom" />
          <MasterDecisionGridPage pageViewModel={vm} rawContent={fixtureCitySymptom} />
        </div>
      );
    }
    case "emergency":
      return (
        <div>
          <DemoBanner slug="emergency" />
          <EmergencyPageTemplate data={fixtureEmergency} city="Tampa" />
        </div>
      );
    default:
      notFound();
  }
}

function DemoBanner({ slug }: { slug: string }) {
  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950">
      Page build demo — <span className="font-mono">{slug}</span> — static fixture, noindex
    </div>
  );
}
