import { HubHero } from "@/components/hub/HubHero";
import { HubSection } from "@/components/hub/HubSection";
import { SystemOverviewGrid } from "@/components/hub/SystemOverviewGrid";
import { CommonProblemsGrid } from "@/components/hub/CommonProblemsGrid";
import { DiagnosticGuidesGrid } from "@/components/hub/DiagnosticGuidesGrid";
import { ComponentFailuresGrid } from "@/components/hub/ComponentFailuresGrid";
import { RepairGuidesGrid } from "@/components/hub/RepairGuidesGrid";
import sql from "@/lib/db";

export const revalidate = 3600;

// Curated anchors
const TOP_SYSTEMS = [
  { title: "Central Air Conditioning", description: "Comprehensive guides for split systems and package units.", href: "/diagnose/ac-not-cooling", iconType: "ac" as const },
  { title: "Furnaces", description: "Gas, electric, and oil furnace troubleshooting paths.", href: "/diagnose/furnace-not-heating", iconType: "furnace" as const },
  { title: "Heat Pumps", description: "Reversing valves, defrost cycles, and auxiliary heat.", href: "/diagnose/heat-pump-not-heating", iconType: "heatpump" as const },
  { title: "Thermostats", description: "Smart stats, blank screens, and short cycling logic.", href: "/diagnose/thermostat-blank", iconType: "thermostat" as const },
  { title: "Mini Splits", description: "Ductless wall units, cassettes, and multi-zone diagnostics.", href: "/diagnose/mini-split-not-cooling", iconType: "ac" as const },
  { title: "Drainage / Condensate", description: "Clogged lines, pan overflows, and pump failures.", href: "/diagnose/ac-leaking-water", iconType: "water" as const }
];

const TOP_PROBLEMS = [
  { title: "AC Not Cooling", description: "System running but blowing warm or room temp air.", href: "/diagnose/ac-not-cooling" },
  { title: "Furnace Not Heating", description: "Blower running but no heat, or full ignition failure.", href: "/diagnose/furnace-not-heating" },
  { title: "HVAC Short Cycling", description: "System turns on and off rapidly before reaching temp.", href: "/diagnose/ac-short-cycling" },
  { title: "High Energy Bills", description: "Spikes in electrical or gas usage unexplained by weather.", href: "/diagnose/high-energy-bills" },
  { title: "Water Leaking", description: "Puddles around indoor unit or active ceiling drips.", href: "/diagnose/ac-leaking-water" },
  { title: "Strange Noises", description: "Squealing, banging, or buzzing from indoor/outdoor units.", href: "/diagnose/ac-making-noise" }
];

const TOP_COMPONENTS = [
  { title: "Capacitor", description: "Dual run and start capacitor failure signatures.", href: "/causes/bad-capacitor" },
  { title: "Contactor", description: "Burned, pitted, or stuck low-voltage relays.", href: "/causes/bad-contactor" },
  { title: "Evaporator Coil", description: "Frozen banks, dirty fins, and restriction profiling.", href: "/causes/dirty-evaporator-coil" },
  { title: "Blower Motor", description: "ECM and PSC motor torque or bearing failures.", href: "/causes/bad-blower-motor" },
  { title: "Flame Sensor", description: "Micro-amp drops causing short ignition cycles.", href: "/causes/dirty-flame-sensor" },
  { title: "Refrigerant Leak", description: "Low charge, freezing, and poor capacity faults.", href: "/causes/refrigerant-leak" },
  { title: "Heat Exchanger", description: "Cracks, rollout trips, and CO safety hazards.", href: "/causes/cracked-heat-exchanger" },
  { title: "Condensate Pump", description: "Float switch trips shutting down total system power.", href: "/causes/failed-condensate-pump" }
];

export default async function ResidentialHub() {
  // DB hydration for remaining dynamic zones
  const dbSymptoms = await sql`
    SELECT slug, title as name
    FROM pages 
    WHERE page_type = 'symptom' AND site = 'hvac' AND quality_status = 'published'
    ORDER BY priority DESC 
    LIMIT 9
  `.catch(() => []);

  const dbDiagnostics = await sql`
    SELECT slug, title as name
    FROM pages 
    WHERE page_type = 'diagnostic' AND site = 'hvac' AND quality_status = 'published'
    ORDER BY created_at DESC 
    LIMIT 9
  `.catch(() => []);

  const dbCauses = await sql`
    SELECT slug, title as name
    FROM pages 
    WHERE page_type = 'cause' AND site = 'hvac' AND quality_status = 'published'
    ORDER BY created_at DESC 
    LIMIT 9
  `.catch(() => []);

  const dbRepairs = await sql`
    SELECT slug, title as name
    FROM pages 
    WHERE page_type = 'repair' AND site = 'hvac' AND quality_status = 'published'
    ORDER BY created_at DESC 
    LIMIT 9
  `.catch(() => []);

  const dynamicSymptoms = dbSymptoms.length > 0 
    ? dbSymptoms.map((d: any) => ({ title: d.name || d.slug, description: "Common failure signature overview.", href: `/symptoms/${d.slug}` }))
    : TOP_PROBLEMS.slice(0, 9).map(p => ({ title: p.title, description: p.description, href: p.href }));

  const dynamicDiagnostics = dbDiagnostics.length > 0 
    ? dbDiagnostics.map((d: any) => ({ title: d.name || d.slug, description: "View full diagnostic process.", href: `/diagnose/${d.slug}` }))
    : TOP_PROBLEMS.slice(0, 9).map(p => ({ title: `Diagnose: ${p.title}`, description: p.description, href: p.href }));

  const dynamicCauses = dbCauses.length > 0
    ? dbCauses.map((c: any) => ({ title: c.name || c.slug, description: "Component and mechanical failure root causes.", href: `/causes/${c.slug}` }))
    : TOP_COMPONENTS.slice(0, 9).map(c => ({ title: c.title, description: c.description, href: c.href }));

  const dynamicRepairs = dbRepairs.length > 0
    ? dbRepairs.map((r: any) => ({ title: r.name || r.slug, description: "Step-by-step repair guide.", href: `/fix/${r.slug}` }))
    : TOP_COMPONENTS.slice(0, 9).map(c => ({ title: `Replace ${c.title}`, description: c.description, href: `/fix/replace-${c.title.toLowerCase().replace(/ /g, '-')}` }));

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <HubHero
        theme="residential"
        badgeText="Residential HVAC Engine"
        title="Diagnostic Intelligence."
        description="Stop throwing parts at symptom assumptions. Master the exact technical pathways for Central Air, Gas Furnaces, Heat Pumps, and Mini-Splits."
        primaryCTA={{ label: "Start Diagnosis", href: "/diagnose" }}
      />

      <HubSection 
        id="systems"
        title="Core Systems" 
        subtitle="Identify root causes specifically mapped to your overarching HVAC installation class."
      >
        <SystemOverviewGrid items={TOP_SYSTEMS} />
      </HubSection>

      <HubSection 
        id="problems"
        title="Common HVAC Problems" 
        subtitle="The most statistically probable breakdown vectors forcing service calls."
        className="bg-slate-50 dark:bg-slate-900/40"
      >
        <CommonProblemsGrid items={dynamicSymptoms} />
      </HubSection>

      <HubSection 
        id="diagnostics"
        title="Diagnostic Guides" 
        subtitle="Step-by-step sequential verification protocols to eliminate guesswork."
      >
        <DiagnosticGuidesGrid items={dynamicDiagnostics} />
      </HubSection>

      <HubSection 
        id="causes"
        title="Component Failures & Causes" 
        subtitle="Navigate directly to the specific mechanical or electrical failure mechanism."
        className="bg-slate-50 dark:bg-slate-900/40"
      >
        <ComponentFailuresGrid items={dynamicCauses} />
      </HubSection>

      <HubSection 
        id="repairs"
        title="Repair Guides" 
        subtitle="EPA compliant, safety-first mitigation paths for certified and DIY fixes."
      >
        <RepairGuidesGrid items={dynamicRepairs} />
      </HubSection>
    </div>
  );
}
