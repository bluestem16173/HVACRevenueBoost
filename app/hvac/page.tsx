import { HubHero } from "@/components/hub/HubHero";
import { HubSection } from "@/components/hub/HubSection";
import { SystemOverviewGrid } from "@/components/hub/SystemOverviewGrid";
import { CommonProblemsGrid } from "@/components/hub/CommonProblemsGrid";
import { DiagnosticGuidesGrid } from "@/components/hub/DiagnosticGuidesGrid";
import { ComponentFailuresGrid } from "@/components/hub/ComponentFailuresGrid";
import { AirflowGrid } from "@/components/hub/AirflowGrid";
import { ElectricalGrid } from "@/components/hub/ElectricalGrid";
import { RepairGuidesGrid } from "@/components/hub/RepairGuidesGrid";
import { CostGuidesGrid } from "@/components/hub/CostGuidesGrid";
import { AuthorityGrid } from "@/components/hub/AuthorityGrid";
import sql from "@/lib/db";

export const revalidate = 3600;

const SYSTEMS = [
  { title: "Central AC Systems", description: "Comprehensive guides for split systems and package units.", href: "/systems/central-ac" },
  { title: "Furnaces", description: "Gas, electric, and oil furnace troubleshooting paths.", href: "/systems/furnace" },
  { title: "Heat Pumps", description: "Reversing valves, defrost cycles, and auxiliary heat.", href: "/systems/heat-pump" },
  { title: "Ductless Mini Splits", description: "Ductless wall units, cassettes, and multi-zone diagnostics.", href: "/systems/mini-split" },
  { title: "Thermostat Systems", description: "Smart stats, blank screens, and short cycling logic.", href: "/systems/thermostat" },
  { title: "Air Handlers", description: "Blower motors, coils, and static pressure management.", href: "/systems/air-handler" }
];

const TOP_SYMPTOMS = [
  { title: "AC Not Cooling", description: "System running but blowing warm or room temp air.", href: "/diagnose/ac-not-cooling" },
  { title: "AC Freezing Up", description: "Ice forming on the evaporator coil or suction line.", href: "/diagnose/ac-freezing-up" },
  { title: "Furnace Not Heating", description: "Blower running but no heat, or full ignition failure.", href: "/diagnose/furnace-not-heating" },
  { title: "HVAC Short Cycling", description: "System turns on and off rapidly before reaching temp.", href: "/diagnose/hvac-short-cycling" },
  { title: "Uneven Cooling or Heating", description: "Hot and cold spots caused by ductwork or airflow.", href: "/diagnose/uneven-cooling" },
  { title: "High Energy Bills", description: "Spikes in electrical or gas usage unexplained by weather.", href: "/diagnose/high-energy-bills" },
  { title: "Strange Noises from HVAC", description: "Squealing, banging, or buzzing from indoor/outdoor units.", href: "/diagnose/hvac-making-noise" },
  { title: "Weak Airflow from Vents", description: "Poor air velocity and CFM drops across registers.", "href": "/diagnose/weak-airflow" },
  { title: "HVAC Not Turning On", description: "Total power loss to thermostat or equipment.", "href": "/diagnose/hvac-not-turning-on" }
];

const TOP_DIAGNOSTICS = [
  { title: "How to Diagnose AC Not Cooling", description: "Step-by-step sequential verification protocols.", href: "/diagnose/ac-not-cooling" },
  { title: "How to Diagnose Furnace Issues", description: "Ignition sequence and safety switch testing.", href: "/diagnose/furnace-not-heating" },
  { title: "Step-by-Step HVAC Troubleshooting", description: "General isolation logic for unknown failures.", href: "/diagnose/hvac-troubleshooting" },
  { title: "How to Test Thermostat", description: "Bypassing stats with jumper wires safely.", href: "/diagnose/test-thermostat" },
  { title: "How to Check Airflow Issues", description: "Static pressure and Delta-T diagnostic flow.", href: "/diagnose/check-airflow" },
  { title: "HVAC Electrical Diagnostics", description: "Tracing 24v shorts and high-voltage drops.", href: "/diagnose/hvac-electrical" }
];

const TOP_CAUSES = [
  { title: "AC Compressor Failure", description: "Locked rotors, grounded terminals, and thermal overloads.", href: "/cause/bad-ac-compressor" },
  { title: "Capacitor Failure", description: "Swollen tops and microfarad tolerances.", href: "/cause/bad-capacitor" },
  { title: "Blower Motor Failure", description: "ECM modules and PSC bearing seizure.", href: "/cause/bad-blower-motor" },
  { title: "Thermostat Failure", description: "Blank screens and failed internal relays.", href: "/cause/bad-thermostat" },
  { title: "Evaporator Coil Issues", description: "Micro-leaks and severe airflow restrictions.", href: "/cause/dirty-evaporator-coil" },
  { title: "Condenser Coil Problems", description: "High head pressure caused by outdoor dirt.", href: "/cause/dirty-condenser-coil" },
  { title: "Expansion Valve Failure", description: "Stuck TXVs causing freezing or starvation.", href: "/cause/bad-txv" },
  { title: "Control Board Failure", description: "Burnt traces and failed blower relays.", href: "/cause/bad-control-board" }
];

const AIRFLOW = [
  { title: "Blocked Airflow", description: "Diagnose restricted registers and return blockages.", href: "/cause/blocked-airflow" },
  { title: "Dirty Air Filters", description: "The exact effects of 1-inch and 4-inch filter restriction.", href: "/maintenance/change-hvac-filter" },
  { title: "Duct Leaks", description: "Identify unconditioned air loss in attics and crawlspaces.", href: "/cause/leaking-ductwork" },
  { title: "Static Pressure Issues", description: "Calculate and diagnose high TESP across the air handler.", href: "/diagnose/high-static-pressure" },
  { title: "Closed Vents Problems", description: "Why closing registers destroys ECM blower motors.", href: "/cause/closed-hvac-vents" },
  { title: "Poor Air Distribution", description: "Hot and cold spots caused by improper duct sizing.", href: "/diagnose/uneven-cooling" }
];

const ELECTRICAL = [
  { title: "Capacitor Issues", description: "Test and replace dual-run MFD capacitors safely.", href: "/cause/bad-capacitor" },
  { title: "Relay Failures", description: "Diagnose stuck or pitted high-voltage contactors.", href: "/cause/bad-contactor" },
  { title: "Breaker Trips (HVAC-specific)", description: "Trace grounded compressors and short-to-ground faults.", href: "/diagnose/hvac-tripping-breaker" },
  { title: "Wiring Problems", description: "Repair burnt terminals, chewed wires, and loose lugs.", href: "/cause/burnt-hvac-wiring" },
  { title: "Voltage Irregularities", description: "Measure line and low voltage drops under load.", href: "/diagnose/hvac-low-voltage" },
  { title: "Transformer Issues", description: "Diagnose open 24v control transformers.", href: "/cause/blown-transformer" }
];

const TOP_REPAIRS = [
  { title: "Replace AC Capacitor", description: "Safely isolate and install a new dual run capacitor.", href: "/repair/replace-capacitor" },
  { title: "Fix Frozen AC Unit", description: "Thaw and execute the full system operational checklist.", href: "/repair/fix-frozen-ac" },
  { title: "Repair Furnace Ignitor", description: "Identify and replace brittle hot surface ignitors.", href: "/repair/replace-ignitor" },
  { title: "Replace Blower Motor", description: "Rewire and mount replacement PSC or ECM modules.", href: "/repair/replace-blower-motor" },
  { title: "Fix Thermostat Issues", description: "Hardwire logic and backplate swap methodologies.", href: "/repair/fix-thermostat" },
  { title: "Recharge Refrigerant", description: "Evacuation, leak checking, and superheat charging.", href: "/repair/recharge-hvac" }
];

const COST_GUIDES = [
  { title: "AC Repair Cost", description: "Average service call and minor part replacement pricing.", href: "/cost/ac-repair-cost" },
  { title: "Compressor Replacement Cost", description: "OEM vs aftermarket scroll and rotary compressor costs.", href: "/cost/ac-compressor-replacement" },
  { title: "Furnace Repair Cost", description: "Labor and parts for gas valve and ignitor repairs.", href: "/cost/furnace-repair-cost" },
  { title: "HVAC Service Call Cost", description: "Standard trip charges vs emergency weekend dispatches.", href: "/cost/hvac-service-call-fee" },
  { title: "Refrigerant Recharge Cost", description: "R-410A and R-22 per-pound pricing limits.", href: "/cost/refrigerant-recharge-cost" },
  { title: "Thermostat Replacement Cost", description: "Cost to install smart stats like Nest and Ecobee.", href: "/cost/thermostat-installation-cost" }
];

const AUTHORITY_GUIDES = [
  { title: "How Air Conditioners Work", description: "The refrigeration cycle and heat absorption logic.", href: "/authority/how-ac-works" },
  { title: "How Furnaces Work", description: "Ignition sequences and safe combustion principles.", href: "/authority/how-furnaces-work" },
  { title: "How Heat Pumps Work", description: "Reversing valves, defrost modes, and auxiliary strips.", href: "/authority/how-heat-pumps-work" },
  { title: "How HVAC Systems Work", description: "The full residential forced-air architecture.", href: "/authority/how-hvac-works" },
  { title: "What is SEER Rating", description: "Calculate seasonal energy efficiency ratios properly.", href: "/authority/hvac-seer-rating" },
  { title: "What Causes HVAC Failures", description: "The exact statistical breakdown of core system drops.", href: "/authority/common-hvac-failures" }
];

const PINNED_SYMPTOMS = [
  "ac-not-cooling",
  "furnace-not-heating",
  "hvac-short-cycling"
];

const PINNED_DIAGNOSTICS = [
  "ac-not-cooling-diagnostic",
  "furnace-not-heating-diagnostic"
];

export default async function ResidentialHub() {
  const dbSymptoms = await sql`
    SELECT slug, title as name
    FROM pages 
    WHERE page_type = 'symptom' AND site = 'hvac' AND quality_status = 'published'
    ORDER BY 
      CASE WHEN slug = ANY(${PINNED_SYMPTOMS}) THEN 1 ELSE 2 END,
      priority DESC, created_at DESC 
    LIMIT 9
  `.catch(() => []);

  const dbDiagnostics = await sql`
    SELECT slug, title as name
    FROM pages 
    WHERE page_type = 'diagnostic' AND site = 'hvac' AND quality_status = 'published'
    ORDER BY 
      CASE WHEN slug = ANY(${PINNED_DIAGNOSTICS}) THEN 1 ELSE 2 END,
      created_at DESC 
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
    ? dbSymptoms.map((d: any) => ({ title: d.name || d.slug, description: "Common failure signature overview.", href: `/diagnose/${d.slug}` }))
    : TOP_SYMPTOMS;

  const dynamicDiagnostics = dbDiagnostics.length > 0 
    ? dbDiagnostics.map((d: any) => ({ title: d.name || d.slug, description: "View full diagnostic process.", href: `/diagnose/${d.slug}` }))
    : TOP_DIAGNOSTICS;

  const dynamicCauses = dbCauses.length > 0
    ? dbCauses.map((c: any) => ({ title: c.name || c.slug, description: "Component and mechanical failure root causes.", href: `/cause/${c.slug}` }))
    : TOP_CAUSES;

  const dynamicRepairs = dbRepairs.length > 0
    ? dbRepairs.map((r: any) => ({ title: r.name || r.slug, description: "Step-by-step repair guide.", href: `/repair/${r.slug}` }))
    : TOP_REPAIRS;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <HubHero
        theme="residential"
        badgeText="Free HVAC Diagnostic Guides"
        title="HVAC Troubleshooting & Repair Guides"
        description="Diagnose HVAC problems, understand causes, and find the right fix fast."
        primaryCTA={{ label: "Start Diagnosis", href: "/diagnose/ac-not-cooling" }}
        secondaryCTA={{ label: "View Common Problems", href: "#problems" }}
      />

      <HubSection 
        id="systems"
        title="HVAC Systems" 
        subtitle="Identify root causes specifically mapped to your overarching HVAC installation class."
      >
        <SystemOverviewGrid items={SYSTEMS} />
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
        id="airflow"
        title="Airflow & Ducting" 
        subtitle="Troubleshoot static pressure blocks, filtration limits, and distribution faults."
      >
        <AirflowGrid items={AIRFLOW} />
      </HubSection>

      <HubSection 
        id="electrical"
        title="HVAC Electrical" 
        subtitle="Trace high voltage delivery paths, low voltage drops, and failed circuitry."
        className="bg-slate-50 dark:bg-slate-900/40"
      >
        <ElectricalGrid items={ELECTRICAL} />
      </HubSection>

      <HubSection 
        id="repairs"
        title="Repair Guides" 
        subtitle="EPA compliant, safety-first mitigation paths for certified and DIY fixes."
      >
        <RepairGuidesGrid items={dynamicRepairs} />
      </HubSection>

      <HubSection 
        id="cost"
        title="Cost Guides" 
        subtitle="Transparent cost-per-pound and labor breakdowns localized to major metros."
        className="bg-slate-50 dark:bg-slate-900/40"
      >
        <CostGuidesGrid items={COST_GUIDES} />
      </HubSection>

      <HubSection 
        id="authority"
        title="How HVAC Works" 
        subtitle="Master the thermodynamic principles and mechanical rules behind active systems."
      >
        <AuthorityGrid items={AUTHORITY_GUIDES} />
      </HubSection>
    </div>
  );
}
