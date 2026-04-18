import type { ReactNode } from "react";
import { resolveDgAuthorityMermaidChart } from "@/lib/dg/resolveDgAuthorityMermaidChart";
import { DGHero } from "@/components/dg/DGHero";
import { DGSection } from "@/components/dg/DGSection";
// TEMP: import { DGMermaid } from "@/components/dg/DGMermaidDynamic";
import { DGFailureCluster } from "@/components/dg/DGFailureCluster";
import { DGRepairMatrix } from "@/components/dg/DGRepairMatrix";
import { DGTechBlock } from "@/components/dg/DGTechBlock";
import { DGNextStep } from "@/components/dg/DGNextStep";
import { LiveElectricitySafetyNotice } from "@/components/LiveElectricitySafetyNotice";

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function warningsBlock(w: unknown): ReactNode {
  if (!Array.isArray(w)) return null;
  const lines = w.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  if (lines.length === 0) return null;
  return (
    <ul className="dg-warnings-list">
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}

/**
 * **Locked render order** for dg_authority_v2 structured diagnostic pages.
 * Do not reorder without updating the product contract + `assertDgAuthorityV2StructuredPayload`.
 */
export function RenderDGAuthority({ data }: { data: Record<string, unknown> }) {
  const title = asString(data.title);
  const summary = asString(data.summary_30s);
  const quick = asStringArray(data.quick_checks);
  const logic = asString(data.diagnostic_logic);
  const system = asString(data.system_explanation);
  const clustersRaw = Array.isArray(data.failure_clusters) ? data.failure_clusters : [];
  const clusters = clustersRaw
    .map((c) => asRecord(c))
    .filter(Boolean)
    .map((c) => ({
      category: asString(c!.category),
      details: asString(c!.details),
    }))
    .filter((c) => c.category || c.details);
  const matrix = asStringArray(data.repair_matrix);
  const measurements = asStringArray(data.field_measurements);
  const repairVs = asString(data.repair_vs_replace);
  const pro = asString(data.professional_threshold);
  const nextText = asString(data.next_step) || asString(data.cta);
  const warnBody = warningsBlock(data.warnings);

  const mermaidChart = resolveDgAuthorityMermaidChart(data) || "";
  const hasMermaid = Boolean(mermaidChart.trim());

  return (
    <>
      <DGHero title={title} summary={summary} />

      {quick.length > 0 ? (
        <DGSection title="Quick Checks">
          <ul className="dg-check-list">
            {quick.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </DGSection>
      ) : null}

      <LiveElectricitySafetyNotice />

      {logic ? (
        <DGSection title="Diagnostic Logic">
          <p className="dg-body">{logic}</p>
        </DGSection>
      ) : null}

      {hasMermaid ? (
        <DGSection title="Diagnostic flow">
          <p className="dg-body text-sm text-slate-500">Flowchart temporarily disabled.</p>
          {/* TEMP: <DGMermaid chart={mermaidChart} /> */}
        </DGSection>
      ) : null}

      {system ? (
        <DGSection title="System Explanation">
          <p className="dg-body">{system}</p>
        </DGSection>
      ) : null}

      {clusters.length > 0 ? (
        <DGSection title="Failure Clusters">
          {clusters.map((c, i) => (
            <DGFailureCluster key={`${c.category}-${i}`} title={c.category} text={c.details} />
          ))}
        </DGSection>
      ) : null}

      {matrix.length > 0 ? <DGRepairMatrix items={matrix} /> : null}

      {measurements.length > 0 ? (
        <DGTechBlock title="Field Measurements">
          <ul className="dg-measure-list">
            {measurements.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </DGTechBlock>
      ) : null}

      {repairVs ? (
        <DGTechBlock title="Repair vs Replace">
          <p className="dg-body">{repairVs}</p>
        </DGTechBlock>
      ) : null}

      {pro ? (
        <DGSection title="Professional Threshold">
          <p className="dg-body">{pro}</p>
        </DGSection>
      ) : null}

      {warnBody ? (
        <DGSection title="Warnings">{warnBody}</DGSection>
      ) : null}

      {nextText ? <DGNextStep text={nextText} /> : null}
    </>
  );
}
