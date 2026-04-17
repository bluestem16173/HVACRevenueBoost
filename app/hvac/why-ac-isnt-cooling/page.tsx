import type { Metadata } from "next";
import Link from "next/link";
import { RenderDgAuthorityV3 } from "@/components/dg/RenderDgAuthorityV3";
import { buildDgAuthorityV3Page } from "@/lib/dg/buildDgAuthorityV3Page";
import { HVAC_PILLAR_WHY_AC_ISNT_COOLING_V3 } from "@/lib/dg-authority-structured-preview/dgAuthorityV3Demos";

const pillarData = buildDgAuthorityV3Page(HVAC_PILLAR_WHY_AC_ISNT_COOLING_V3);

export const metadata: Metadata = {
  title: `${HVAC_PILLAR_WHY_AC_ISNT_COOLING_V3.title} | HVAC`,
  description: HVAC_PILLAR_WHY_AC_ISNT_COOLING_V3.summary_30s.slice(0, 160),
};

export default function HvacWhyAcIsntCoolingPillarPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 pt-6 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-hvac-blue">
          Home
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <Link href="/hvac" className="hover:text-hvac-blue">
          HVAC
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {HVAC_PILLAR_WHY_AC_ISNT_COOLING_V3.title}
        </span>
      </nav>
      <div className="mx-auto max-w-4xl px-4 pb-16">
        <RenderDgAuthorityV3 data={pillarData} trade="hvac" pagePath="hvac/why-ac-isnt-cooling" />
      </div>
    </div>
  );
}
