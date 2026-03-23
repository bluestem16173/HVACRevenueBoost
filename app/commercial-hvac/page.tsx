import { HubHero } from "@/components/hub/HubHero";
import { HubSection } from "@/components/hub/HubSection";
import { SystemOverviewGrid } from "@/components/hub/SystemOverviewGrid";
import { CommonProblemsGrid } from "@/components/hub/CommonProblemsGrid";
import { DiagnosticGuidesGrid } from "@/components/hub/DiagnosticGuidesGrid";
import { ComponentFailuresGrid } from "@/components/hub/ComponentFailuresGrid";
import { RepairGuidesGrid } from "@/components/hub/RepairGuidesGrid";

export const revalidate = 3600;

// Hardcoded Static Commercial Clusters
const COMM_SYSTEMS = [
  { title: "Rooftop Units (RTUs)", description: "Packaged cooling and heating isolation for multi-zone commercial spaces.", href: "/commercial-diagnose/rtu", iconType: "ac" as const },
  { title: "Chillers", description: "Air-cooled and water-cooled large tonnage liquid loop troubleshooting.", href: "/commercial-diagnose/chillers", iconType: "water" as const },
  { title: "Cooling Towers", description: "Heat rejection, fill media, and basin monitoring.", href: "/commercial-diagnose/cooling-towers", iconType: "ventilation" as const },
  { title: "Boilers", description: "Commercial hydronic and steam loop pressure/ignition failures.", href: "/commercial-diagnose/boilers", iconType: "furnace" as const },
  { title: "VAV Systems", description: "Variable Air Volume terminal boxes, dampers, and static pressure logic.", href: "/commercial-diagnose/vav", iconType: "ventilation" as const },
  { title: "Makeup Air Units", description: "Direct-fired heating and exhaust compensation loops.", href: "/commercial-diagnose/mau", iconType: "heatpump" as const }
];

const COMM_PROBLEMS = [
  { title: "Loss of Static Pressure", description: "VFD tripping, loose belts, or VAV box damper cascading failure.", href: "/commercial-diagnose/loss-of-static-pressure" },
  { title: "RTU Hard Lockout", description: "Repeated ignition failures triggering board-level safe states.", href: "/commercial-diagnose/rtu-hard-lockout" },
  { title: "High Head Pressure", description: "Microchannel coil plugging, fan failure, or condenser loop flow restrictions.", href: "/commercial-diagnose/high-head-pressure" },
  { title: "Chiller Surge", description: "Compressor lift exceeds design resulting in violent flow reversal.", href: "/commercial-diagnose/chiller-surge" },
  { title: "Space Overcooling", description: "Reheat valve failure or baseline BAS calibration drift.", href: "/commercial-diagnose/space-overcooling" },
  { title: "Freeze Stat Trips", description: "Mixed air anomalies or low velocity across hydronic coils.", href: "/commercial-diagnose/freeze-stat-trip" }
];

const COMM_COMPONENTS = [
  { title: "Variable Frequency Drives (VFD)", description: "Overcurrent faults, harmonic distortion, and parameter resets.", href: "/commercial-causes/vfd-fault" },
  { title: "Economizer Actuators", description: "Linkage binding, motor burnout, or enthalpy sensor drift.", href: "/commercial-causes/economizer-failure" },
  { title: "Scroll Compressors", description: "Phase reversal, flooded starts, and contactor pitting.", href: "/commercial-causes/scroll-compressor" },
  { title: "VAV Reheat Valves", description: "Stuck stems, blown diaphragms, or loss of control signal.", href: "/commercial-causes/reheat-valve" },
  { title: "Cooling Tower Fans", description: "Gearbox degradation, belt slip, and vibration limits.", href: "/commercial-causes/tower-fan" },
  { title: "BAS Controllers", description: "Loss of comms, blown 24v input fuses, and point overrides.", href: "/commercial-causes/bas-controller" },
  { title: "Direct-Fired Burners", description: "Profile plate clogging and UV scanner blindness.", href: "/commercial-causes/direct-fired-burner" },
  { title: "Chilled Water Pumps", description: "Seal leaks, coupling alignment, and base cavitation.", href: "/commercial-causes/chilled-water-pump" }
];

const COMM_DIAGNOSTICS = [
  { title: "Troubleshoot RTU Cooling", description: "Multi-stage cooling logic and capacity staging verification.", href: "/commercial-diagnose/rtu-cooling-fault" },
  { title: "Diagnose Boiler Lockout", description: "Flame safeguard sequences and low-water cutoffs.", href: "/commercial-diagnose/boiler-lockout" },
  { title: "VAV Airflow Deficiencies", description: "Pitot tube traverses and K-factor flow ring validations.", href: "/commercial-diagnose/vav-low-airflow" },
];

const COMM_REPAIRS = [
  { title: "Replace RTU Belt & Sheave", description: "Tensioning limits and laser alignment for extended blower lifespan.", href: "/commercial-repair/replace-rtu-belt" },
  { title: "Rebuild VAV Actuator", description: "Stroke calibration and direct-coupled motor swaps.", href: "/commercial-repair/vav-actuator-swap" },
  { title: "Clean Cooling Tower Basin", description: "Biological mitigation and strainer basket flushes.", href: "/commercial-repair/clean-tower-basin" },
  { title: "Replace Economizer Sensor", description: "Dry bulb or enthalpy node extraction and BAS mapping.", href: "/commercial-repair/replace-economizer-sensor" },
];

export default function CommercialHub() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <HubHero
        theme="commercial"
        badgeText="Commercial Architecture"
        title="Industrial Diagnostics."
        description="Complex facility control loops, BAS integration faults, and heavy-tonnage mechanical breakdown frameworks."
        primaryCTA={{ label: "View Infrastructure", href: "#systems" }}
      />

      <HubSection 
        id="systems"
        title="Facility Core Infrastructure" 
        subtitle="Root cause networks optimized for heavy tonnage and hydronic loop structures."
      >
        <SystemOverviewGrid items={COMM_SYSTEMS} />
      </HubSection>

      <HubSection 
        id="problems"
        title="Critical Alarm Triggers" 
        subtitle="Frequent sequence interruptions resulting in multi-zone tenant disruption."
        className="bg-slate-50 dark:bg-slate-900/40"
      >
        <CommonProblemsGrid items={COMM_PROBLEMS} />
      </HubSection>

      <HubSection 
        id="diagnostics"
        title="Enterprise Flowcharts" 
        subtitle="Verification protocol across multi-stage, high-voltage operations."
      >
        <DiagnosticGuidesGrid items={COMM_DIAGNOSTICS} />
      </HubSection>

      <HubSection 
        id="components"
        title="Industrial Wear Patterns" 
        subtitle="High-MTBF part failures isolated for rapid replacement and facility uptime."
        className="bg-slate-50 dark:bg-slate-900/40"
      >
        <ComponentFailuresGrid items={COMM_COMPONENTS} />
      </HubSection>

      <HubSection 
        id="repairs"
        title="Heavy-Duty Operations" 
        subtitle="OSHA compliant replacement strategies for structural components."
      >
        <RepairGuidesGrid items={COMM_REPAIRS} />
      </HubSection>
    </div>
  );
}
