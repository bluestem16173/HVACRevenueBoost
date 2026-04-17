import type { ReactNode } from "react";
import { diagnosticFlowToMermaidSource } from "@/lib/dg/diagnosticFlowToMermaid";
import { asCtaPayload } from "@/lib/dg/dgAuthorityCta";
import type { Trade } from "@/lib/dg/resolveCTA";
import { issuePhraseFromPageTitle } from "@/lib/dg/resolveCTA";
import { DgAuthorityStickyCta } from "@/components/dg/DgAuthorityStickyCta";
import { renderDualLayer } from "@/components/dg/DgDualLayer";
import { DGLegend } from "@/components/dg/DGLegend";
import { DGHero } from "@/components/dg/DGHero";
import { DGSection } from "@/components/dg/DGSection";
import { DGMermaid } from "@/components/dg/DGMermaidDynamic";
import { DGTechBlock } from "@/components/dg/DGTechBlock";
import { DGCTA } from "@/components/dg/DGCTA";
import { DGBeforeCallChecklist } from "@/components/dg/DGBeforeCallChecklist";
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

function pickMidCta(data: Record<string, unknown>): unknown {
  return data.cta_mid ?? data.cta_midpage;
}

/** Normalize for duplicate detection (not for display). */
function normCopy(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Drop warning lines that repeat a “do not attempt” line verbatim (normalized). */
function dedupeWarningsAgainstDoNotAttempt(warnings: string[], doNot: string[]): string[] {
  if (!doNot.length) return warnings;
  const d = new Set(doNot.map(normCopy));
  return warnings.filter((w) => !d.has(normCopy(w)));
}

type RiskNoteRow = { label: string; text: string };

function parseRiskNoteRows(raw: unknown): RiskNoteRow[] {
  if (!Array.isArray(raw)) return [];
  const out: RiskNoteRow[] = [];
  for (const row of raw) {
    const o = asRecord(row);
    if (!o) continue;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const text = typeof o.text === "string" ? o.text.trim() : "";
    if (label && text) out.push({ label, text });
  }
  return out;
}

/** Remove risk_note entries whose body duplicates a warning line (normalized full-text match). */
function filterRiskNotesAgainstWarnings(rows: RiskNoteRow[], warningLines: string[]): RiskNoteRow[] {
  if (!warningLines.length) return rows;
  const w = new Set(warningLines.map(normCopy));
  return rows.filter((r) => !w.has(normCopy(r.text)));
}

/** When `field_measurements_pro` is just the same lines as `field_measurements[]`, skip the bare list (PRO layer carries them). */
function fieldMeasurementsListRedundantWithPro(parts: string[], pro: string): boolean {
  const p = pro.trim();
  if (!p || parts.length === 0) return false;
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\u2013|\u2014/g, "-");

  const blob = normalize(p);
  const lines = parts.map((x) => normalize(x)).filter(Boolean);
  if (!lines.length) return false;

  if (lines.join("\n") === blob.replace(/\n+/g, "\n").trim()) return true;

  return lines.every((line) => line.length >= 8 && blob.includes(line));
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

function riskNotesBlockFromRows(rows: RiskNoteRow[]): ReactNode {
  if (!rows.length) return null;
  return (
    <div className="dg-risk-notes">
      {rows.map((row, i) => (
        <div key={`${row.label}-${i}`} className="dg-risk-note">
          <p className="dg-risk-note__label">{row.label}</p>
          <p className="dg-risk-note__text">{row.text}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * **dg_authority_v3** — dual-layer sections + **JSON CTAs** (`cta_top`, `cta_mid`, `cta_final`).
 * Quick checks: list = measurable PRO lines; `quick_checks_home` = HOME (optional legacy `quick_checks_pro` overrides joined list).
 * Optional `trade` on the article passes through for lead prefill only.
 */
export function RenderDgAuthorityV3({
  data,
  trade,
}: {
  data: Record<string, unknown>;
  trade?: Trade;
}) {
  const title = asString(data.title);
  const summary = asString(data.summary_30s);
  const quick = asStringArray(data.quick_checks);
  const quickProOverride = asString(data.quick_checks_pro);
  const quickProDerived = quickProOverride || (quick.length ? quick.join("\n\n") : "");
  const quickHome = asString(data.quick_checks_home);
  const logicPro = asString(data.diagnostic_logic_pro);
  const logicHome = asString(data.diagnostic_logic_home);
  const system = asString(data.system_explanation);

  const clustersRaw = Array.isArray(data.failure_clusters) ? data.failure_clusters : [];
  const clusters = clustersRaw
    .map((c) => asRecord(c))
    .filter(Boolean)
    .map((c) => ({
      title: asString(c!.title),
      pro: asString(c!.pro),
      home: asString(c!.home),
      risk: asString(c!.risk),
    }))
    .filter((c) => c.title && c.pro && c.home && c.risk);

  const matrix = asStringArray(data.repair_matrix);
  const matrixPro = asString(data.repair_matrix_pro);
  const matrixHome = asString(data.repair_matrix_home);
  const matrixRisk = asString(data.repair_matrix_risk);

  const measurements = asStringArray(data.field_measurements);
  const measPro = asString(data.field_measurements_pro);
  const measHome = asString(data.field_measurements_home);

  const rvrPro = asString(data.repair_vs_replace_pro);
  const rvrHome = asString(data.repair_vs_replace_home);

  const pro = asString(data.professional_threshold);
  const beforeCall = asStringArray(data.before_you_call ?? data.before_you_call_checks);
  const doNot = asStringArray(data.do_not_attempt);

  const warningStrings = asStringArray(data.warnings);
  const warningsDeduped = dedupeWarningsAgainstDoNotAttempt(warningStrings, doNot);
  const warnBody = warningsBlock(warningsDeduped);

  const riskRowsFiltered = filterRiskNotesAgainstWarnings(
    parseRiskNoteRows(data.risk_notes),
    warningsDeduped
  );
  const riskBody = riskNotesBlockFromRows(riskRowsFiltered);

  const matrixRiskDeduped =
    matrixRisk &&
    !warningsDeduped.some((line) => normCopy(line) === normCopy(matrixRisk))
      ? matrixRisk
      : "";

  const hasMermaid = Boolean(diagnosticFlowToMermaidSource(data.diagnostic_flow));

  const ctaTop = asCtaPayload(data.cta_top);
  const ctaMid = asCtaPayload(pickMidCta(data));
  const ctaFinal = asCtaPayload(data.cta_final);

  const locationLabel = asString(data.location);
  const leadIssueShort =
    title ? issuePhraseFromPageTitle(title, locationLabel || undefined) || title : "";

  const leadProps = {
    leadIssue: leadIssueShort,
    leadLocation: locationLabel || undefined,
    leadTrade: trade,
  };

  const core = (
    <>
      <DGLegend />
      <DGHero title={title} summary={summary} />

      {ctaTop ? <DGCTA {...ctaTop} variant="hero" {...leadProps} /> : null}

      {quickHome && quickProDerived ? (
        <DGSection title="Quick Checks">
          <div className="dg-quick-split">
            <div className="dg-quick-split__col dg-quick-split__col--pro">
              <p className="dg-quick-split__label">Technical (field checks)</p>
              {quick.length > 0 ? (
                <ul className="dg-quick-split__list">
                  {quick.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              ) : (
                <div className="dg-quick-split__prose dg-body">
                  {quickProDerived.split(/\n\n+/).map((chunk, i) => (
                    <p key={i} className={i > 0 ? "mt-3" : ""}>
                      {chunk.trim()}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="dg-quick-split__col dg-quick-split__col--home">
              <p className="dg-quick-split__label">Homeowner (what this means)</p>
              <p className="dg-quick-split__home-text">{quickHome}</p>
            </div>
          </div>
        </DGSection>
      ) : null}

      <DGBeforeCallChecklist beforeYouCall={beforeCall} doNotAttempt={[]} sections="before-only" />

      <LiveElectricitySafetyNotice />

      {logicPro ? (
        <DGSection title="Diagnostic Logic">{renderDualLayer(logicPro, logicHome)}</DGSection>
      ) : null}

      {hasMermaid ? (
        <DGSection title="Diagnostic flow">
          <DGMermaid source={data.diagnostic_flow} />
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
            <div key={`${c.title}-${i}`} className="dg-failure">
              <h3>{c.title}</h3>
              {renderDualLayer(c.pro, c.home, c.risk)}
            </div>
          ))}
        </DGSection>
      ) : null}

      {matrix.length > 0 && matrixPro ? (
        <DGSection title="Repair Matrix">
          <h3 className="dg-repair-title">Typical Repair Outcomes</h3>
          <div className="dg-repair-grid">
            {matrix.map((item, i) => (
              <div key={i} className="dg-repair-card">
                {item}
              </div>
            ))}
          </div>
          {renderDualLayer(matrixPro, matrixHome, matrixRiskDeduped || undefined)}
          {ctaMid ? <DGCTA {...ctaMid} variant="mid" conversionLock {...leadProps} /> : null}
        </DGSection>
      ) : null}

      {measurements.length > 0 && measPro ? (
        <DGTechBlock title="Field Measurements">
          {!fieldMeasurementsListRedundantWithPro(measurements, measPro) ? (
            <ul className="dg-measure-list">
              {measurements.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          ) : null}
          {renderDualLayer(measPro, measHome)}
        </DGTechBlock>
      ) : null}

      {rvrPro ? (
        <DGTechBlock title="Repair vs Replace">{renderDualLayer(rvrPro, rvrHome)}</DGTechBlock>
      ) : null}

      {pro ? (
        <DGSection title="Professional Threshold">
          <p className="dg-body">{pro}</p>
        </DGSection>
      ) : null}

      {warnBody ? (
        <DGSection title="Warnings" className="dg-warnings-block">
          {warnBody}
        </DGSection>
      ) : null}

      {riskBody}

      {ctaFinal ? <DGCTA {...ctaFinal} variant="final" conversionLock {...leadProps} /> : null}

      <DGBeforeCallChecklist beforeYouCall={[]} doNotAttempt={doNot} sections="do-not-only" />
    </>
  );

  if (!ctaFinal) {
    return core;
  }

  return (
    <div className="dg-authority-v3-conversion-wrap pb-28 md:pb-0">
      {core}
      <DgAuthorityStickyCta
        title={ctaFinal.title}
        body={ctaFinal.body}
        button={ctaFinal.button}
        leadIssue={leadIssueShort}
        leadLocation={locationLabel || undefined}
        leadTrade={trade}
      />
    </div>
  );
}
