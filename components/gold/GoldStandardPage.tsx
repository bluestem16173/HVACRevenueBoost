"use client";

import React, { useEffect, useId, useMemo, useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Wrench,
  DollarSign,
  Activity,
  ShieldAlert,
  ArrowRight,
  ClipboardList,
  Clock3,
  MapPin,
} from "lucide-react";

export type Probability = "High" | "Medium" | "Low";

export interface SummaryBullet {
  text: string;
}

export interface QuickCheckItem {
  text: string;
}

export interface CauseRow {
  problem: string;
  likelyCause: string;
  difficulty: string;
  cost: string;
  probability: Probability;
  href?: string;
}

export interface DeepDiveCause {
  title: string;
  whyItHappens: string;
  tools?: string[];
  fixSteps?: string[];
}

export interface RepairCard {
  title: string;
  difficulty: string;
  cost: string;
  summary: string;
  href?: string;
  urgency?: string;
  time?: string;
}

export interface ToolItem {
  name: string;
  whyNeeded: string;
}

export interface CostRow {
  repair: string;
  typicalRange: string;
  urgency: string;
}

export interface RelatedLink {
  title: string;
  href: string;
  label?: string;
}

export interface GoldStandardSymptomPageProps {
  breadcrumbSystem?: { label: string; href: string };
  breadcrumbSymptom?: string;
  title: string;
  intro: string;
  reviewedBy?: string;
  techNote?: string;

  fastAnswerTitle?: string;
  mostLikelyIssue: string;
  summaryBullets: SummaryBullet[];
  mostCommonFix?: {
    title: string;
    detail: string;
    difficulty?: string;
    cost?: string;
    time?: string;
  };

  checklist: QuickCheckItem[];
  diagnosticFlowTitle?: string;
  mermaidCode?: string;
  flowCaption?: string;
  decisionPrompts?: { condition: string; action: string }[];
  causeActionBridges?: { cause: string; action: string }[];
  confidenceSignalText?: string;

  causesTable: CauseRow[];
  deepDiveCauses: DeepDiveCause[];
  repairCards?: RepairCard[];
  tools?: ToolItem[];
  costs?: CostRow[];
  technicianInsights?: string[];
  ignoreRisk?: string;
  mistakesToAvoid?: string[];
  preventionTips?: string[];
  faqs?: { question: string; answer: string }[];
  relatedLinks?: RelatedLink[];
  cta?: {
    title: string;
    body: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel?: string;
    secondaryHref?: string;
  };
  techInterpretation?: {
    summary: string;
    safety?: string;
    commonCauses?: string[];
    steps?: string[];
    insight?: string;
    explanation?: string;
  };
  toolsTable?: { name: string; why: string; beginner?: string }[];
  repairOptionsTable?: { fix: string; cost: string; difficulty: string }[];
  comparison?: { category: string; budget: string; value: string }[];
  preventative?: string[];
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Mermaid must receive a string; malformed JSON sometimes nests chart data as objects. */
function toMermaidString(input: unknown): string | undefined {
  if (input == null) return undefined;
  if (typeof input === "string") {
    const t = input.trim();
    return t.length ? t : undefined;
  }
  if (typeof input === "object") {
    const o = input as Record<string, unknown>;
    const nested =
      (typeof o.mermaid === "string" && o.mermaid.trim()) ||
      (typeof o.chart === "string" && o.chart.trim()) ||
      (typeof o.code === "string" && o.code.trim());
    if (nested) return nested;
  }
  return undefined;
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 max-w-3xl text-slate-600">{subtitle}</p>
      ) : null}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-700">
      {children}
    </span>
  );
}

function ProbabilityPill({ value }: { value: Probability }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
        value === "High" && "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
        value === "Medium" &&
          "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
        value === "Low" && "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200"
      )}
    >
      {value}
    </span>
  );
}

function MermaidDiagram({ code }: { code?: string }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const safeCode = typeof code === "string" ? code : "";

    async function renderChart() {
      if (!ref.current || !safeCode.trim()) return;

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
          },
        });
        const { svg } = await mermaid.render(`mermaid-${id}`, safeCode);
        if (mounted && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch {
        if (mounted && ref.current) {
          ref.current.innerHTML = `
            <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Unable to render flowchart. Check Mermaid syntax.
            </div>
          `;
        }
      }
    }

    void renderChart();

    return () => {
      mounted = false;
    };
  }, [code, id]);

  return <div ref={ref} className="mermaid-diagram overflow-x-auto" />;
}

function DecisionPrompt({ prompts }: { prompts?: { condition: string; action: string }[] }) {
  if (!prompts?.length) return null;
  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Start Here</div>
      <h2 className="mt-2 text-xl font-black text-slate-900">Follow this decision path</h2>
      <div className="mt-4 space-y-3">
        {prompts.map((p, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-blue-100">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">{i + 1}</span>
            <div className="text-sm text-slate-700">
              <span className="font-semibold">{p.condition}</span>{" → "}<span className="font-semibold text-blue-700">{p.action}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PrimaryFlow({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-md">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">Diagnostic Flow (Start Here)</div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CauseActionBridge({ causes }: { causes?: { cause: string; action: string }[] }) {
  if (!causes?.length) return null;
  return (
    <section className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-green-700">What to Do Next</div>
      <div className="mt-4 space-y-3">
        {causes.map((c, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-green-100">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div className="text-sm text-slate-700">
              <span className="font-semibold">{c.cause}</span>{" → "}<span className="font-semibold text-green-700">{c.action}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConfidenceSignal({ text }: { text?: string }) {
  if (!text) return null;
  return <div className="mt-5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{text}</div>;
}

function StartButton({ href }: { href: string }) {
  return (
    <a href={href} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white shadow-md transition hover:-translate-y-0.5">
      Start Diagnosis
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

function FastAnswer({
  title = "Fast Answer",
  mostLikelyIssue,
  bullets,
  mostCommonFix,
}: {
  title?: string;
  mostLikelyIssue: string;
  bullets: SummaryBullet[];
  mostCommonFix?: {
    title: string;
    detail: string;
    difficulty?: string;
    cost?: string;
    time?: string;
  };
}) {
  return (
    <section
      id="fast-answer"
      className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-7"
    >
      <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
        {title}
      </div>

      <div className="mt-3 flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-red-50 p-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900 md:text-xl">
            Your system is most likely dealing with:
          </p>
          <p className="mt-1 text-xl font-black text-red-600 md:text-2xl">
            {mostLikelyIssue}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {(bullets || []).map((bullet, idx) => (
          <li key={`${bullet.text}-${idx}`} className="flex gap-3 text-slate-700">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-700" />
            <span>{bullet.text}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-sm text-slate-600">
        Want to confirm it in under a minute? Follow the checklist and diagnostic
        path below.
      </p>

      {mostCommonFix ? (
        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
            Most Common Fix
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900">
            {mostCommonFix.title}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-700">
            {mostCommonFix.detail}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {mostCommonFix.difficulty ? (
              <Badge>Difficulty: {mostCommonFix.difficulty}</Badge>
            ) : null}
            {mostCommonFix.cost ? <Badge>Cost: {mostCommonFix.cost}</Badge> : null}
            {mostCommonFix.time ? <Badge>Time: {mostCommonFix.time}</Badge> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function QuickChecklist({ items }: { items: QuickCheckItem[] }) {
  return (
    <section
      id="quick-diagnostic-checklist"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Quick Diagnostic Checklist"
        subtitle="Start here before replacing parts or scheduling service. These checks eliminate the most common failures fast."
      />
      <div className="grid gap-3">
        {(items || []).map((item, idx) => (
          <label
            key={`${item.text}-${idx}`}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800"
          >
            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300" />
            <span>{item.text}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function DiagnosticFlow({
  title = "Diagnostic Flow",
  caption,
  mermaidCode,
}: {
  title?: string;
  caption?: string;
  mermaidCode?: string;
}) {
  return (
    <section
      id="diagnostic-flow"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto"
    >
      <div className="bg-slate-900 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white">
        {title}
      </div>
      <div className="p-5 md:p-6">
        {caption ? <p className="mb-4 text-sm text-slate-600">{caption}</p> : null}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-6">
          {mermaidCode ? (
            <MermaidDiagram code={mermaidCode} />
          ) : (
            <div className="text-sm text-slate-500">No flowchart available.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function CausesAtAGlance({ rows }: { rows: CauseRow[] }) {
  return (
    <section
      id="causes-at-a-glance"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Causes at a Glance"
        subtitle="Use this table to narrow the fault before committing to a repair path."
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
            <tr>
              <th className="p-4 text-left">Problem</th>
              <th className="p-4 text-left">Likely Cause</th>
              <th className="p-4 text-left">Difficulty</th>
              <th className="p-4 text-left">Cost</th>
              <th className="p-4 text-left">Probability</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((row, idx) => {
              const content = (
                <>
                  <td className="p-4 font-semibold text-slate-900">{row.problem}</td>
                  <td className="p-4 text-slate-700">
                    {row.href ? (
                      <span className="font-semibold text-blue-700 underline-offset-2 hover:underline">
                        {row.likelyCause}
                      </span>
                    ) : (
                      row.likelyCause
                    )}
                  </td>
                  <td className="p-4 text-slate-700">{row.difficulty}</td>
                  <td className="p-4 text-slate-700">{row.cost}</td>
                  <td className="p-4">
                    <ProbabilityPill value={row.probability} />
                  </td>
                </>
              );

              return row.href ? (
                <tr
                  key={`${row.problem}-${idx}`}
                  className="cursor-pointer border-t border-slate-200 transition-colors hover:bg-slate-50"
                >
                  <td colSpan={5} className="p-0">
                    <a href={row.href} className="grid grid-cols-1 md:grid-cols-5">
                      {content}
                    </a>
                  </td>
                </tr>
              ) : (
                <tr
                  key={`${row.problem}-${idx}`}
                  className="border-t border-slate-200 transition-colors hover:bg-slate-50"
                >
                  {content}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DeepDive({ causes }: { causes: DeepDiveCause[] }) {
  return (
    <section
      id="common-causes-and-possible-fixes"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Common Causes and Possible Fixes"
        subtitle="Detailed breakdown of each failure point so you can judge what is DIY-safe and what needs a technician."
      />
      <div className="space-y-5">
        {(causes || []).map((cause, idx) => (
          <article
            key={`${cause.title}-${idx}`}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-xl font-bold text-slate-900">{cause.title}</h3>
            <p className="mt-3 font-medium leading-7 text-slate-600">
              {cause.whyItHappens}
            </p>

            {cause.tools?.length ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-700">
                  <Wrench className="h-4 w-4" />
                  Tools you may need
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {(cause.tools || []).map((tool, toolIdx) => (
                    <div
                      key={`${tool}-${toolIdx}`}
                      className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                      <span>{tool}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {cause.fixSteps?.length ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-700">
                  <ClipboardList className="h-4 w-4" />
                  Typical fix steps
                </div>
                <div className="space-y-2">
                  {(cause.fixSteps || []).map((step, stepIdx) => (
                    <div
                      key={`${step}-${stepIdx}`}
                      className="flex gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                        {stepIdx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function MidPageCTA({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
        Need HVAC help fast?
      </div>
      <h3 className="mt-2 text-xl font-black text-slate-900">
        If this issue is urgent, get a technician involved now.
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
        If the unit is tripping breakers, icing over, leaking heavily, or blowing warm
        air during extreme heat, professional diagnosis may save you from replacing
        the wrong part.
      </p>
      <a
        href={href}
        className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
      >
        {label}
      </a>
    </section>
  );
}

function RepairCards({ cards }: { cards: RepairCard[] }) {
  return (
    <section
      id="repair-paths"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Repair Paths"
        subtitle="These are the most common next-step fixes based on the symptoms above."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(cards || []).map((card, idx) => {
          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>Difficulty: {card.difficulty}</Badge>
                <Badge>Cost: {card.cost}</Badge>
                {card.time ? <Badge>Time: {card.time}</Badge> : null}
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">{card.summary}</p>
            </>
          );

          return card.href ? (
            <a
              key={`${card.title}-${idx}`}
              href={card.href}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {inner}
            </a>
          ) : (
            <div
              key={`${card.title}-${idx}`}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ToolsRequired({ items }: { items: ToolItem[] }) {
  return (
    <section
      id="tools-required"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Tools Required"
        subtitle="Only bring out tools that actually help confirm the fault or complete the repair safely."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {(items || []).map((item, idx) => (
          <div
            key={`${item.name}-${idx}`}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="font-semibold text-slate-900">{item.name}</div>
            <div className="mt-1 text-sm text-slate-600">{item.whyNeeded}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TypicalRepairCosts({ rows }: { rows: CostRow[] }) {
  return (
    <section
      id="typical-repair-costs"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Typical Repair Costs"
        subtitle="Repair pricing varies by system type, parts access, and technician labor in your area."
      />
      <div className="grid gap-3">
        {(rows || []).map((row, idx) => (
          <div
            key={`${row.repair}-${idx}`}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="font-semibold text-slate-900">{row.repair}</div>
              <div className="mt-1 text-sm text-slate-600">Urgency: {row.urgency}</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-slate-900 ring-1 ring-slate-200">
              <DollarSign className="h-4 w-4" />
              {row.typicalRange}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TechnicianInsights({ insights }: { insights: string[] }) {
  return (
    <section
      id="technician-insights"
      className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm"
    >
      <SectionHeading
        title="Technician Insights"
        subtitle="Field notes that help separate likely causes from expensive wrong guesses."
      />
      <div className="space-y-3">
        {(insights || []).map((insight, idx) => (
          <div
            key={`${insight}-${idx}`}
            className="rounded-xl bg-white/80 px-4 py-3 text-slate-700 ring-1 ring-blue-100"
          >
            “{insight}”
          </div>
        ))}
      </div>
    </section>
  );
}

function WarningBox({ title, body }: { title: string; body: string }) {
  return (
    <section
      id="what-happens-if-you-ignore-this"
      className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-white p-2 text-red-600 ring-1 ring-red-200">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <p className="mt-2 leading-7 text-slate-700">{body}</p>
        </div>
      </div>
    </section>
  );
}

function BulletColumns({
  title,
  items,
  icon,
  id,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  id: string;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2 text-slate-900">
        {icon}
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      <div className="grid gap-2">
        {(items || []).map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            className="flex gap-3 rounded-lg bg-slate-50 px-3 py-3 text-slate-700"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQs({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <section
      id="frequently-asked-questions"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading title="Frequently Asked Questions" />
      <div className="space-y-4">
        {(faqs || []).map((faq, idx) => (
          <details
            key={`${faq.question}-${idx}`}
            className="group rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <summary className="cursor-pointer list-none font-semibold text-slate-900">
              {faq.question}
            </summary>
            <p className="mt-3 text-sm leading-6 text-slate-700">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function RelatedReading({ links }: { links: RelatedLink[] }) {
  return (
    <section
      id="related-guides"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <SectionHeading
        title="Related Guides"
        subtitle="Keep users inside the graph by linking upward, sideways, and downward into nearby diagnostic entities."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(links || []).map((link, idx) => (
          <a
            key={`${link.href}-${idx}`}
            href={link.href}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {link.label ? (
              <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                {link.label}
              </div>
            ) : null}
            <div className="mt-1 font-semibold text-slate-900">{link.title}</div>
          </a>
        ))}
      </div>
    </section>
  );
}

function CTA({ cta }: { cta: NonNullable<GoldStandardSymptomPageProps["cta"]> }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 text-white shadow-lg">
      <div className="max-w-3xl">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">
          Get Local HVAC Repair Help
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
          {cta.title}
        </h2>
        <p className="mt-3 leading-7 text-slate-200">{cta.body}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={cta.primaryHref}
          className="inline-flex items-center rounded-xl bg-white px-5 py-3 font-bold text-slate-900 transition hover:-translate-y-0.5"
        >
          {cta.primaryLabel}
        </a>
        {cta.secondaryLabel && cta.secondaryHref ? (
          <a
            href={cta.secondaryHref}
            className="inline-flex items-center rounded-xl border border-white/30 px-5 py-3 font-bold text-white transition hover:bg-white/10"
          >
            {cta.secondaryLabel}
          </a>
        ) : null}
      </div>
    </section>
  );
}

function TechInterpretation({
  title = "What This Problem Usually Means",
  summary,
  safety,
  commonCauses,
  steps,
  insight,
  explanation,
}: {
  title?: string;
  summary: string;
  safety?: string;
  commonCauses?: string[];
  steps?: string[];
  insight?: string;
  explanation?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        {title}
      </div>

      <p className="mt-3 text-slate-700 leading-7 font-medium">
        {summary}
      </p>

      {safety && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Safety Note:</strong> {safety}
        </div>
      )}

      {commonCauses?.length && (
        <div className="mt-5">
          <div className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">
            Most Common Causes
          </div>
          <ul className="mt-2 space-y-2 text-slate-700">
            {commonCauses.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-bold text-blue-700">{i + 1}.</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {steps?.length && (
        <div className="mt-5">
          <div className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">
            Quick Troubleshooting Steps
          </div>

          <div className="mt-3 space-y-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {insight && (
        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
          <strong>Field Insight:</strong> {insight}
        </div>
      )}

      {explanation && (
        <p className="mt-5 text-slate-600 leading-7">
          {explanation}
        </p>
      )}
    </section>
  );
}

function ToolsTable({
  tools,
}: {
  tools: { name: string; why: string; beginner?: string }[];
}) {
  if (!tools?.length) return null;

  return (
    <section id="tools-required" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">Tools Required for Diagnosis</h2>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 font-bold text-slate-700">
            <tr>
              <th className="p-3 text-left">Tool</th>
              <th className="p-3 text-left">Why You Need It</th>
              <th className="p-3 text-left">Beginner?</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((t, i) => (
              <tr key={i} className="border-t">
                <td className="p-3 font-semibold">{t.name}</td>
                <td className="p-3">{t.why}</td>
                <td className="p-3">{t.beginner || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RepairOptions({
  options,
}: {
  options: { fix: string; cost: string; difficulty: string }[];
}) {
  if (!options?.length) return null;

  return (
    <section id="repair-paths" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">Repair Options</h2>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 font-bold text-slate-700">
            <tr>
              <th className="p-3 text-left">Fix</th>
              <th className="p-3 text-left">Cost</th>
              <th className="p-3 text-left">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {options.map((o, i) => (
              <tr key={i} className="border-t">
                <td className="p-3 font-semibold">{o.fix}</td>
                <td className="p-3">{o.cost}</td>
                <td className="p-3">{o.difficulty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ComparisonTable({
  rows,
}: {
  rows: { category: string; budget: string; value: string }[];
}) {
  if (!rows?.length) return null;

  return (
    <section id="comparison-analysis" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">
        DecisionGrid Comparison: Replacement Parts
      </h2>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 font-bold text-slate-700">
            <tr>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Best Budget</th>
              <th className="p-3 text-left">Best Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-3 font-semibold">{r.category}</td>
                <td className="p-3">{r.budget}</td>
                <td className="p-3">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PreventativeMaintenance({
  tips,
}: {
  tips: string[];
}) {
  if (!tips?.length) return null;

  return (
    <section id="preventative-maintenance" className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">
        Preventative Maintenance
      </h2>

      <div className="mt-4 space-y-2">
        {tips.map((t, i) => (
          <div key={i} className="flex gap-2 text-slate-700">
            <span className="text-green-600 font-bold">✔</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function GoldStandardSymptomPage(props: GoldStandardSymptomPageProps) {
  const onThisPage = useMemo(() => {
    return [
      { label: "Fast Answer", href: "#fast-answer" },
      props.checklist?.length
        ? {
            label: "Quick Diagnostic Checklist",
            href: "#quick-diagnostic-checklist",
          }
        : null,
      props.mermaidCode?.trim()
        ? { label: "Diagnostic Flow", href: "#diagnostic-flow" }
        : null,
      props.causesTable?.length
        ? { label: "Causes at a Glance", href: "#causes-at-a-glance" }
        : null,
      props.deepDiveCauses?.length
        ? {
            label: "Common Causes and Possible Fixes",
            href: "#common-causes-and-possible-fixes",
          }
        : null,
      (props.toolsTable?.length ?? props.tools?.length) ? { label: "Tools Required", href: "#tools-required" } : null,
      (props.repairOptionsTable?.length ?? props.repairCards?.length) ? { label: "Repair Paths", href: "#repair-paths" } : null,
      props.comparison?.length ? { label: "Comparison Analysis", href: "#comparison-analysis" } : null,
      props.preventative?.length ? { label: "Preventative Maintenance", href: "#preventative-maintenance" } : null,
      props.costs?.length
        ? { label: "Typical Repair Costs", href: "#typical-repair-costs" }
        : null,
      props.technicianInsights?.length
        ? { label: "Technician Insights", href: "#technician-insights" }
        : null,
      props.ignoreRisk
        ? {
            label: "What Happens If You Ignore This?",
            href: "#what-happens-if-you-ignore-this",
          }
        : null,
      props.faqs?.length
        ? {
            label: "Frequently Asked Questions",
            href: "#frequently-asked-questions",
          }
        : null,
    ].filter(Boolean) as { label: string; href: string }[];
  }, [props]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <nav className="mb-6 text-sm text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <a href="/" className="hover:text-slate-700">
              Home
            </a>
            <span>/</span>
            {props.breadcrumbSystem ? (
              <>
                <a href={props.breadcrumbSystem.href} className="hover:text-slate-700">
                  {props.breadcrumbSystem.label}
                </a>
                <span>/</span>
              </>
            ) : null}
            <span className="text-slate-700">
              {props.breadcrumbSymptom ?? props.title}
            </span>
          </div>
        </nav>

        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Reviewed by Certified HVAC Technicians</Badge>
            {props.reviewedBy ? <Badge>{props.reviewedBy}</Badge> : null}
          </div>

          <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            {props.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
            {props.intro}
          </p>

          {props.techNote ? (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                Tech Note
              </div>
              <p className="mt-2 leading-7 text-slate-700">{props.techNote}</p>
            </div>
          ) : null}
        </header>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <FastAnswer
              title={props.fastAnswerTitle}
              mostLikelyIssue={props.mostLikelyIssue}
              bullets={props.summaryBullets}
              mostCommonFix={props.mostCommonFix}
            />

            {props.techInterpretation && (
              <TechInterpretation {...props.techInterpretation} />
            )}

            {props.confidenceSignalText ? <ConfidenceSignal text={props.confidenceSignalText} /> : null}
            <StartButton href="#diagnostic-flow" />

            {props.decisionPrompts?.length ? <DecisionPrompt prompts={props.decisionPrompts} /> : null}

            {props.checklist?.length ? <QuickChecklist items={props.checklist} /> : null}

            {props.mermaidCode || props.diagnosticFlowTitle ? (
              <PrimaryFlow>
                <DiagnosticFlow
                  title={props.diagnosticFlowTitle}
                  caption={
                    props.flowCaption ??
                    "Follow this step-by-step path to isolate the issue before spending money on the wrong repair."
                  }
                  mermaidCode={props.mermaidCode}
                />
              </PrimaryFlow>
            ) : null}

            {props.causesTable?.length ? (
              <CausesAtAGlance rows={props.causesTable} />
            ) : null}
            
            {props.causeActionBridges?.length ? <CauseActionBridge causes={props.causeActionBridges} /> : null}

            {props.deepDiveCauses?.length ? (
              <DeepDive causes={props.deepDiveCauses} />
            ) : null}

            {props.toolsTable?.length ? <ToolsTable tools={props.toolsTable} /> : (props.tools?.length ? <ToolsRequired items={props.tools} /> : null)}
            {props.repairOptionsTable?.length ? <RepairOptions options={props.repairOptionsTable} /> : (props.repairCards?.length ? <RepairCards cards={props.repairCards} /> : null)}
            {props.comparison?.length ? <ComparisonTable rows={props.comparison} /> : null}
            {props.preventative?.length ? <PreventativeMaintenance tips={props.preventative} /> : null}

            {props.cta?.primaryHref && props.cta?.primaryLabel ? (
              <MidPageCTA href={props.cta.primaryHref} label={props.cta.primaryLabel} />
            ) : null}

            {props.costs?.length ? <TypicalRepairCosts rows={props.costs} /> : null}
            {props.technicianInsights?.length ? (
              <TechnicianInsights insights={props.technicianInsights} />
            ) : null}
            {props.ignoreRisk ? (
              <WarningBox
                title="What Happens If You Ignore This?"
                body={props.ignoreRisk}
              />
            ) : null}

            {props.mistakesToAvoid?.length ? (
              <BulletColumns
                id="mistakes-to-avoid"
                title="Mistakes to Avoid"
                items={props.mistakesToAvoid}
                icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
              />
            ) : null}

            {props.preventionTips?.length && !props.preventative?.length ? (
              <BulletColumns
                id="prevention-tips"
                title="Prevention Tips"
                items={props.preventionTips}
                icon={<Activity className="h-5 w-5 text-blue-700" />}
              />
            ) : null}

            {props.faqs?.length ? <FAQs faqs={props.faqs} /> : null}
            {props.relatedLinks?.length ? <RelatedReading links={props.relatedLinks} /> : null}
            {props.cta ? <CTA cta={props.cta} /> : null}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                On This Page
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                {onThisPage.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-lg bg-slate-50 px-3 py-2 transition hover:bg-slate-100"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
                Most likely issue
              </div>
              <div className="mt-2 font-bold text-slate-900">{props.mostLikelyIssue}</div>
              {props.mostCommonFix?.cost ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 ring-1 ring-orange-200">
                  <DollarSign className="h-4 w-4" />
                  {props.mostCommonFix.cost}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Need help fast?
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                If the unit is tripping breakers, icing over, leaking heavily, or blowing
                warm air in extreme heat, a technician can save you from misdiagnosing it.
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-red-600" />
                  Fast diagnosis
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  Local service options
                </div>
              </div>
              <a
                href={props.cta?.primaryHref ?? "#"}
                className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
              >
                {props.cta?.primaryLabel ?? "Get AC Diagnosed Today"}
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function GoldStandardFallback({
  title,
  detail,
  extra,
}: {
  title: string;
  detail?: string;
  extra?: unknown;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-slate-800">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-wide text-amber-900">{title}</p>
        {detail ? <p className="mt-2 text-sm text-slate-700">{detail}</p> : null}
        {extra != null ? (
          <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-amber-200 bg-white p-3 text-xs text-slate-800">
            {typeof extra === "string" ? extra : JSON.stringify(extra, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

export default function GoldStandardPage({ data }: { data: any }) {
  if (!data) {
    return (
      <GoldStandardFallback
        title="Gold standard layout — no data"
        detail="The page record loaded but GoldStandardPage received no data object. Check normalization and props."
      />
    );
  }
  if (data?.schemaVersion && data.schemaVersion !== "v1") {
    return (
      <GoldStandardFallback
        title="Gold standard layout — schema mismatch"
        detail={`Expected schemaVersion "v1", got ${JSON.stringify(data.schemaVersion)}.`}
        extra={{ slug: data.slug, schemaVersion: data.schemaVersion }}
      />
    );
  }

  const validCauses = Array.isArray(data.causes) ? data.causes : [];
  const validDeepCauses = Array.isArray(data.deep_causes) ? data.deep_causes : [];
  const repairPaths = Array.isArray(data.repair_paths) ? data.repair_paths : [];
  const tools = Array.isArray(data.tools) ? data.tools : [];
  const insights = Array.isArray(data.insights)
    ? data.insights
    : Array.isArray(data.before_calling_tech)
    ? data.before_calling_tech
    : [];
  const mistakes = Array.isArray(data.mistakes) ? data.mistakes : [];
  const prevention = Array.isArray(data.prevention) ? data.prevention : [];
  const faqs = Array.isArray(data.faqs) ? data.faqs : [];

  const topCause =
    validCauses.length > 0
      ? validCauses.find((c: any) => c?.probability === "High") || validCauses[0]
      : null;

  const flow = data.diagnostic_flow;
  const chartRaw =
    flow != null && typeof flow === "object"
      ? (flow as Record<string, unknown>).chart ?? (flow as Record<string, unknown>).mermaid
      : flow ?? data.system_flow;
  const chart = toMermaidString(chartRaw);

  const defaultCTA = {
    title: "Need AC diagnosed by a local HVAC technician?",
    body:
      "If you're not comfortable checking capacitors, refrigerant-related issues, airflow restrictions, or electrical faults, a licensed HVAC technician can isolate the problem quickly and help you avoid replacing the wrong part.",
    primaryLabel: "Get AC Diagnosed Today",
    primaryHref: "/repair",
    secondaryLabel: "Browse Repair Guides",
    secondaryHref: "/diagnose",
  };

  const formatSlug = (slug?: string) => {
    if (!slug) return "";
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };
  const seoTitle = formatSlug(data.slug) || data.title || "Troubleshooting Guide";

  const finalProps: GoldStandardSymptomPageProps = {
    breadcrumbSystem: { label: "Diagnostics", href: "/diagnose" },
    breadcrumbSymptom: seoTitle,
    title: seoTitle,
    intro: data.problem_summary || data.ai_summary?.overview || "",

    fastAnswerTitle: "AI Diagnosis Summary",
    mostLikelyIssue:
      data.ai_summary?.most_likely_issue || topCause?.name || "System fault detected",
    summaryBullets: (data.ai_summary?.bullets || []).map((b: unknown) => ({
      text:
        typeof b === "string"
          ? b
          : b != null && typeof b === "object" && "text" in (b as object)
            ? String((b as { text?: unknown }).text ?? "")
            : String(b ?? ""),
    })),

    mostCommonFix: topCause
      ? {
          title: topCause.name || topCause.cause || "Target the most likely failure first",
          detail:
            topCause.fix_summary ||
            topCause.description ||
            "Start with the highest-probability fault before moving into lower-likelihood repairs.",
          difficulty: topCause.difficulty || "Moderate",
          cost: topCause.cost || "Varies by system",
          time: topCause.time || "30–90 minutes",
        }
      : undefined,
      
    confidenceSignalText: topCause ? "This is the most likely issue in ~60% of cases." : undefined,
    decisionPrompts: validCauses.slice(0, 3).map((c: any) => ({
      condition: c.name || "System fault",
      action: c.fix_summary || c.description || "Review diagnostics",
    })),
    causeActionBridges: validCauses.map((c: any) => ({
      cause: c.name || "System fault",
      action: c.fix_summary || c.description || "Review diagnostics and repair path",
    })),

    checklist: (data.checklist || []).map((c: unknown) => ({
      text: typeof c === "string" ? c : String(c ?? ""),
    })),
    diagnosticFlowTitle: "System Flowchart",
    mermaidCode: chart,

    causesTable: validCauses.map((c: any) => ({
      problem: data.title || "System fault",
      likelyCause: c.name || c.cause || "Unknown cause",
      difficulty: c.difficulty || "Variable",
      cost: c.cost || "Varies",
      probability: (c.probability as Probability) || "Medium",
      href: c.href || (c.name ? `/diagnose/${slugify(c.name)}` : undefined),
    })),

    deepDiveCauses: validDeepCauses.map((c: any) => ({
      title: c.title || c.cause || "Cause",
      whyItHappens: c.whyItHappens || c.why_it_happens || "No explanation provided.",
      tools: Array.isArray(c.tools_needed) ? c.tools_needed : [],
      fixSteps: Array.isArray(c.fix_steps) ? c.fix_steps : [],
    })),

    repairCards: repairPaths.map((r: any) => ({
      title: r.title || "Repair path",
      difficulty: r.difficulty || "Variable",
      cost: r.cost || "Varies by repair",
      summary: r.summary || "Further diagnosis may be required.",
      href: r.href,
      urgency: r.urgency || "Medium",
      time: r.time || "30–90 minutes",
    })),

    tools: tools.map((t: any) => ({
      name: t.name || "Tool",
      whyNeeded: t.purpose || t.why || "Diagnostic step",
    })),

    costs: repairPaths.map((r: any) => ({
      repair: r.title || "Repair",
      typicalRange: r.cost || "Varies by repair",
      urgency: r.urgency || "Medium",
    })),

    technicianInsights: insights,
    ignoreRisk: data.ignore_risk || data.what_happens_if_ignored || "",
    mistakesToAvoid: mistakes,
    preventionTips: prevention,
    faqs,

    relatedLinks: Array.isArray(data.related_links)
      ? data.related_links.map((link: any) => ({
          title: link.title,
          href: link.href,
          label: link.label,
        }))
      : [],

    cta: data.cta
      ? {
          title: data.cta.title || defaultCTA.title,
          body: data.cta.body || defaultCTA.body,
          primaryLabel: data.cta.primaryLabel || defaultCTA.primaryLabel,
          primaryHref: data.cta.primaryHref || defaultCTA.primaryHref,
          secondaryLabel: data.cta.secondaryLabel || defaultCTA.secondaryLabel,
          secondaryHref: data.cta.secondaryHref || defaultCTA.secondaryHref,
        }
      : defaultCTA,

    techInterpretation: data.problem_summary ? {
      summary: data.problem_summary || "",
      safety: data.safety_note,
      commonCauses: validCauses.slice(0, 3).map((c: any) => c.name || c.cause),
      steps: data.quick_steps || data.checklist || [],
      insight: insights[0],
      explanation: data.deep_explanation
    } : undefined,

    toolsTable: data.tools?.map((t: any) => ({
      name: t.name,
      why: t.purpose || t.description || t.why,
      beginner: t.beginner || "Moderate"
    })),

    repairOptionsTable: data.repair_paths?.map((r: any) => ({
      fix: r.title || r.name || r.fix,
      cost: r.cost || "Variable",
      difficulty: r.difficulty || "Variable"
    })),

    comparison: Array.isArray(data.comparison) ? data.comparison : [],
    preventative: Array.isArray(data.prevention) ? data.prevention : [],
  };

  return <GoldStandardSymptomPage {...finalProps} />;
}
