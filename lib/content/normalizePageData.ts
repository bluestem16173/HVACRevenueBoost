/**
 * Normalize Page Data — DB JSON → Typed View Model
 * ------------------------------------------------
 * Single translator layer. Handles legacy vs structured fields.
 * Output is safe for React templates — no raw DB JSON in components.
 * NEVER assume DB content is HTML. Use stripHtmlToText for legacy HTML.
 *
 * @see docs/MASTER-PROMPT-DECISIONGRID.md
 */

import {
  toSafeString,
  stripHtmlToText,
  toStringArray,
  toObjectArray,
  normalizeCauseCards,
  normalizeFaqItems,
  normalizeToolOrPartItems,
  normalizeRepairSteps,
} from "./safeHelpers";
import { titleCase } from "../text-format";
import type {
  BasePageViewModel,
  CauseSummaryRow,
  RankedCauseCard,
  RepairOptionCard,
  SystemCardData,
  GroupedCauseCard,
  GroupedCausesMap,
  DiagnosticFlowPlaceholderData,
  FAQItem,
  RelatedLink,
  MostCommonFixCard,
  GuidedFilterCategory,
  WhenToCallWarning,
  ComponentForFix,
  ComponentLink,
  ToolRequired,
  PreventionTip,
} from "./pageViewModels";

type RawContent = Record<string, unknown> | null | undefined;

/** Map diagnostic_tests (name + steps[]) to step strings — uses toStringArray internally */
function mapDiagnosticTests(tests: unknown[]): string[] {
  const arr = toObjectArray(tests);
  const out: string[] = [];
  for (const obj of arr) {
    const name = toSafeString(obj.name ?? obj.title);
    if (name) out.push(name);
    const steps = Array.isArray(obj.steps) ? obj.steps : [];
    out.push(...toStringArray(steps));
  }
  return out;
}

/** Normalize causes from raw DB shape — uses defensive normalizeCauseCards */
function normalizeCauses(raw: RawContent, graphCauses?: unknown[]): CauseSummaryRow[] {
  const causesTable = raw?.causesTable;
  if (Array.isArray(causesTable) && causesTable.length > 0) {
    return causesTable.map((r: unknown) => {
      const o = (typeof r === "object" && r !== null ? r : {}) as Record<string, unknown>;
      return {
        name: toSafeString(o.likely_cause ?? o.name) ?? "Unknown",
        indicator: toSafeString(o.problem),
        explanation: toSafeString(o.fix_link),
      };
    });
  }
  if (Array.isArray(raw?.commonCauses) && raw.commonCauses.length > 0) {
    return raw.commonCauses.map((r: unknown) => {
      if (typeof r === 'string') {
        return { name: r, indicator: "", explanation: "" };
      }
      const o = (typeof r === "object" && r !== null ? r : {}) as Record<string, unknown>;
      return {
        name: toSafeString(o.cause ?? o.name ?? o.title) ?? "Unknown",
        indicator: toSafeString(o.symptoms ?? o.explanation),
        explanation: toSafeString(o.whyItCausesIssue ?? o.explanation),
      };
    });
  }
  return normalizeCauseCards(raw?.causes, graphCauses);
}

/** Normalize repairs from raw DB shape */
function normalizeRepairs(
  raw: RawContent,
  graphCauses?: unknown[],
  graphRepairs?: Array<{ name?: string; slug?: string; repair_type?: string; skill_level?: string }>
): RepairOptionCard[] {
  const arr = Array.isArray(raw?.repairs) ? raw.repairs : [];
  if (arr.length > 0) {
    return arr.map((r: unknown) => {
      const o = (typeof r === "object" && r !== null ? r : {}) as Record<string, unknown>;
      return {
        name: toSafeString(o.name) ?? "Unknown",
        difficulty: toSafeString(o.difficulty),
        cost: toSafeString(o.cost ?? o.estimated_cost),
        estimated_cost: toSafeString(o.estimated_cost ?? o.cost),
        fix_summary: toSafeString(o.fix_summary),
        explanation: toSafeString(o.explanation),
        link: o.slug ? `/fix/${o.slug}` : o.link as string | undefined,
        slug: toSafeString(o.slug),
        id: toSafeString(o.id),
      };
    });
  }
  if (Array.isArray(graphCauses)) {
    const seen = new Set<string>();
    const out: RepairOptionCard[] = [];
    for (const c of graphCauses) {
      const o = (typeof c === "object" && c !== null ? c : {}) as Record<string, unknown>;
      const repairs = (o.repairDetails as unknown[]) ?? [];
      for (const r of repairs) {
        const ro = (typeof r === "object" && r !== null ? r : {}) as Record<string, unknown>;
        const name = toSafeString(ro.name);
        if (!name || seen.has(name)) continue;
        seen.add(name);
        out.push({
          name,
          difficulty: String(ro.diyDifficulty) === "rookie" ? "Easy" : "Moderate",
          cost: String(ro.estimatedCost) === "low" ? "$50–$150" : String(ro.estimatedCost) === "medium" ? "$150–$450" : "$450+",
          link: ro.slug ? `/fix/${ro.slug}` : undefined,
          slug: toSafeString(ro.slug),
          id: toSafeString(ro.id),
        });
      }
    }
    return out;
  }
  if (Array.isArray(graphRepairs) && graphRepairs.length > 0) {
    return graphRepairs.map((r) => ({
      name: toSafeString(r.name) ?? "Unknown",
      difficulty: toSafeString(r.skill_level ?? r.repair_type) ?? "Moderate",
      cost: r.repair_type === "low" ? "$50–$150" : r.repair_type === "high" ? "$450+" : "$150–$450",
      link: r.slug ? `/fix/${r.slug}` : undefined,
      slug: toSafeString(r.slug),
    }));
  }
  if (Array.isArray(raw?.solutions) && raw.solutions.length > 0) {
    return raw.solutions.map((r: unknown) => {
      if (typeof r === 'string') {
        return {
          name: r,
          difficulty: "Moderate",
          cost: "$50–$600",
          estimated_cost: "$50–$600",
          fix_summary: "",
          explanation: "",
        };
      }
      const o = (typeof r === "object" && r !== null ? r : {}) as Record<string, unknown>;
      return {
        name: toSafeString(o.title ?? o.solution ?? o.name) ?? "Unknown",
        difficulty: "Moderate",
        cost: "$50–$600",
        estimated_cost: "$50–$600",
        fix_summary: toSafeString(o.whenToUse ?? o.escalation),
        explanation: toSafeString(Array.isArray(o.steps) ? o.steps.join(' ') : o.steps),
      };
    });
  }
  return [];
}

/** Rank causes by weighted score. Best causes float to top. Max 8. */
function rankCauses(causes: RankedCauseCard[]): RankedCauseCard[] {
  return causes
    .map((c) => {
      const weight = typeof c.weight === "number" ? c.weight : 0.5;
      const frequency = typeof c.frequency === "number" ? c.frequency : 0.5;
      const severity = typeof c.severity === "number" ? c.severity : 0.5;
      const systemMatch = typeof c.system_match === "number" ? c.system_match : 0.5;
      const score = weight * 0.4 + frequency * 0.2 + severity * 0.2 + systemMatch * 0.2;
      return { ...c, score };
    })
    .sort((a, b) => ((b as { score?: number }).score ?? 0) - ((a as { score?: number }).score ?? 0))
    .slice(0, 8);
}

/** Normalize rankedCauses from LOCKED format: systems[].issues or systems[].likely_issues */
function normalizeRankedCausesFromSystems(raw: RawContent): RankedCauseCard[] | null {
  const systems = raw?.systems;
  if (!Array.isArray(systems) || systems.length === 0) return null;
  const out: RankedCauseCard[] = [];
  const pillarMap: Record<string, string> = {
    Electrical: "Electrical",
    Mechanical: "Mechanical",
    Chemical: "Chemical",
    Structural: "Structural",
  };
  for (const sys of systems) {
    const o = (typeof sys === "object" && sys !== null ? sys : {}) as Record<string, unknown>;
    const systemName = toSafeString(o.name) ?? "";
    const pillar = pillarMap[systemName] ?? (systemName || "Mechanical");
    const issues = Array.isArray(o.issues) ? o.issues : Array.isArray(o.likely_issues) ? o.likely_issues : [];
    for (const issue of issues) {
      const i = (typeof issue === "object" && issue !== null ? issue : {}) as Record<string, unknown>;
      const cause = toSafeString(i.cause);
      if (!cause) continue;
      const proRequired = i.pro_required === true || i.professional_required === true;
      const diff = toSafeString(i.difficulty)?.toLowerCase() ?? "moderate";
      const diyFriendly = proRequired ? "pro" : (diff === "easy" ? "easy" : diff === "hard" ? "pro" : "moderate");
      const why = toSafeString(i.check) ?? toSafeString(i.signs) ?? toSafeString(i.diagnosis) ?? toSafeString(i.symptoms) ?? "";
      const fix = toSafeString(i.fix) ?? toSafeString(i.repair);
      out.push({
        name: cause,
        likelihood: "medium",
        risk: proRequired ? "high" : "medium",
        why,
        diagnose_slug: "",
        repair_slug: "",
        estimated_cost: "",
        pillar,
        faulty_item: cause,
        diy_friendly: diyFriendly,
        repairs: fix ? [{ name: fix, link: "", slug: "" }] : [],
      });
    }
  }
  return out.length > 0 ? rankCauses(out) : null;
}

/** Normalize rankedCauses from top_causes (LOCKED format) when systems empty. Supports string[] or {cause,confidence}[] */
function normalizeRankedCausesFromTopCauses(raw: RawContent): RankedCauseCard[] | null {
  const arr = raw?.top_causes;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const out: RankedCauseCard[] = [];
  for (const item of arr) {
    const cause = typeof item === "string" ? item.trim() : toSafeString((item as Record<string, unknown>)?.cause);
    if (!cause) continue;
    const conf = typeof item === "object" && item !== null
      ? toSafeString((item as Record<string, unknown>).confidence)?.toLowerCase() ?? "medium"
      : "medium";
    out.push({
      name: cause,
      likelihood: conf === "high" ? "high" : conf === "low" ? "low" : "medium",
      risk: "medium",
      why: "",
      diagnose_slug: "",
      repair_slug: "",
      estimated_cost: "",
      pillar: "Mechanical",
      faulty_item: cause,
      diy_friendly: "moderate",
      repairs: [],
    });
  }
  return out.length > 0 ? rankCauses(out) : null;
}

/** Normalize rankedCauses from new card-grid format (raw.rankedCauses) */
function normalizeRankedCausesFromRaw(raw: RawContent): RankedCauseCard[] | null {
  const arr = raw?.rankedCauses;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const out: RankedCauseCard[] = [];
  for (const item of arr) {
    const o = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
    const name = toSafeString(o.name);
    if (!name) continue;
    const repairSlug = toSafeString(o.repair_slug);
    out.push({
      name,
      likelihood: toSafeString(o.likelihood),
      risk: toSafeString(o.risk),
      why: toSafeString(o.why),
      diagnose_slug: toSafeString(o.diagnose_slug),
      repair_slug: repairSlug,
      estimated_cost: toSafeString(o.estimated_cost),
      pillar: toSafeString(o.pillar),
      faulty_item: toSafeString(o.faulty_item),
      diy_friendly: toSafeString(o.diy_friendly),
      weight: typeof o.weight === "number" ? o.weight : undefined,
      frequency: typeof o.frequency === "number" ? o.frequency : undefined,
      severity: typeof o.severity === "number" ? o.severity : undefined,
      system_match: typeof o.system_match === "number" ? o.system_match : undefined,
      repairs: repairSlug ? [{ name: `Fix ${name}`, link: `/fix/${repairSlug}`, slug: repairSlug }] : [],
    });
  }
  return out.length > 0 ? rankCauses(out) : null;
}

/** Build ranked causes (cause + nested repairs) — legacy format */
function buildRankedCauses(
  causes: CauseSummaryRow[],
  repairs: RepairOptionCard[],
  raw: RawContent
): RankedCauseCard[] {
  const fromSystems = normalizeRankedCausesFromSystems(raw ?? {});
  if (fromSystems && fromSystems.length > 0) return fromSystems;
  const fromTopCauses = normalizeRankedCausesFromTopCauses(raw ?? {});
  if (fromTopCauses && fromTopCauses.length > 0) return fromTopCauses;
  const fromRaw = normalizeRankedCausesFromRaw(raw ?? {});
  if (fromRaw && fromRaw.length > 0) return fromRaw;

  const causeRepairs = Array.isArray(raw?.causes)
    ? (raw.causes as unknown[]).map((c: unknown) => {
        const o = (typeof c === "object" && c !== null ? c : {}) as Record<string, unknown>;
        const rList = Array.isArray(o.repairs) ? o.repairs : [];
        return rList.map((r: unknown) => {
          const ro = (typeof r === "object" && r !== null ? r : {}) as Record<string, unknown>;
          return {
            name: toSafeString(ro.name) ?? "Unknown",
            difficulty: toSafeString(ro.difficulty),
            cost: toSafeString(ro.cost ?? ro.estimated_cost),
            link: ro.slug ? `/fix/${ro.slug}` : undefined,
          };
        });
      })
    : [];

  const result = causes.map((c, i) => ({
    ...c,
    repairs: (causeRepairs[i] as RepairOptionCard[]) ?? (i === 0 ? repairs : []),
  }));
  return rankCauses(result);
}

/** Normalize system cards from raw — 4 pillar-level conversion funnels */
function normalizeSystemCards(raw: RawContent): SystemCardData[] | null {
  const arr = raw?.systemCards ?? raw?.system_cards;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const out: SystemCardData[] = [];
  for (const item of arr) {
    const o = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
    const system = toSafeString(o.system);
    const summary = toSafeString(o.summary);
    const diagnose_slug = toSafeString(o.diagnose_slug);
    const repair_slug = toSafeString(o.repair_slug);
    if (!system || !diagnose_slug || !repair_slug) continue;
    const common_causes = Array.isArray(o.common_causes)
      ? (o.common_causes as unknown[]).map((x) => toSafeString(x)).filter(Boolean) as string[]
      : [];
    const risk_level = toSafeString(o.risk_level);
    const validRisk = (risk_level === "low" || risk_level === "medium" || risk_level === "high")
      ? risk_level as "low" | "medium" | "high"
      : "medium";
    out.push({
      system,
      summary: summary ?? "",
      common_causes: common_causes.length > 0 ? common_causes : undefined,
      why: toSafeString(o.why),
      risk_level: validRisk,
      diy_safe: o.diy_safe === true || o.diy_safe === false ? o.diy_safe : undefined,
      diy_range: toSafeString(o.diy_range),
      cost_range: toSafeString(o.cost_range) ?? "$50–$600",
      why_not_diy: toSafeString(o.why_not_diy),
      warning: toSafeString(o.warning),
      diagnose_slug,
      repair_slug,
    });
  }
  return out.length >= 4 ? out.slice(0, 4) : out.length > 0 ? out : null;
}

/** Normalize raw pillar to standard: Electrical, Structural, Chemical, Mechanical */
function normalizePillar(pillar: string | undefined, causeName: string): string {
  const p = (pillar ?? inferPillarFromCauseName(causeName)).toLowerCase();
  if (/electrical|capacitor|breaker|contactor/i.test(p) || /electrical|capacitor|breaker|contactor/i.test(causeName)) return "Electrical";
  if (/ducting|airflow|structural|filter|duct|blower/i.test(p) || /filter|duct|blower|airflow|evaporator.*coil|clogged/i.test(causeName)) return "Structural";
  if (/refrigeration|chemical|refrigerant|leak/i.test(p) || /refrigerant|leak|charge/i.test(causeName)) return "Chemical";
  if (/mechanical|compressor|coil|thermostat|motor/i.test(p) || /compressor|thermostat|motor|mechanical/i.test(causeName)) return "Mechanical";
  const inferred = inferPillarFromCauseName(causeName);
  return inferred === "Structural" || inferred === "Chemical" ? inferred : "Mechanical";
}

const PILLAR_ORDER = ["Electrical", "Structural", "Chemical", "Mechanical"];
const PILLAR_DISPLAY: Record<string, string> = {
  Electrical: "Electrical",
  Structural: "Structural (Ducting)",
  Chemical: "Chemical (Refrigeration)",
  Mechanical: "Mechanical",
};

/** Build system cards from rankedCauses grouped by pillar — fallback when raw.systemCards missing */
function buildSystemCardsFromRankedCauses(rankedCauses: RankedCauseCard[]): SystemCardData[] {
  const byPillar = new Map<string, RankedCauseCard[]>();
  for (const c of rankedCauses) {
    const p = normalizePillar(c.pillar, c.name);
    if (!byPillar.has(p)) byPillar.set(p, []);
    byPillar.get(p)!.push(c);
  }
  const pillars = PILLAR_ORDER.filter((p) => byPillar.has(p));
  const hasOther = byPillar.has("Other");
  const ordered = pillars.length > 0 ? pillars : (hasOther ? ["Other"] : PILLAR_ORDER);
  return (ordered.length > 0 ? ordered : PILLAR_ORDER).slice(0, 4).map((pillar) => {
    const causes = byPillar.get(pillar) ?? [];
    const names = causes.map((c) => c.name).filter(Boolean);
    const first = causes[0];
    const hasHighRisk = causes.some((c) => c.risk === "high");
    const diyFriendly = first?.diy_friendly ?? first?.difficulty;
    const diy_safe = diyFriendly === "easy" || diyFriendly === "rookie";
    const repair_slug = first?.repair_slug ?? first?.repairs?.[0]?.slug ?? "hvac-repair";
    const displayName = PILLAR_DISPLAY[pillar] ?? pillar;
    const firstWhy = (first as { why?: string })?.why ?? "";
    const combinedWhy = causes.slice(0, 3)
      .map((c) => (c as { why?: string }).why)
      .filter(Boolean)
      .join(" ");
    const fieldInsight = (combinedWhy || firstWhy || `Common issues in ${pillar} can cause this symptom.`).trim();
    return {
      system: displayName,
      summary: firstWhy || `Common issues in ${pillar} can cause this symptom.`,
      why: fieldInsight,
      common_causes: names.length > 0 ? names : [pillar],
      risk_level: hasHighRisk ? "high" as const : "medium" as const,
      diy_safe,
      cost_range: first?.estimated_cost ?? first?.cost ?? "$50–$600",
      why_not_diy: !diy_safe ? "Electrical and refrigerant work require professional tools and certification." : undefined,
      diagnose_slug: first?.diagnose_slug ?? `diagnose-${pillar.toLowerCase()}`,
      repair_slug,
    };
  });
}

/** Map system display name to slug for groupedCauses keys */
function systemToSlug(system: string): string {
  return system.toLowerCase().replace(/\s*\/\s*/g, "-").replace(/\s+/g, "_").replace(/-/g, "_") || "other";
}

/** Infer pillar from cause name when pillar is missing — Electrical, Structural, Chemical, Mechanical */
function inferPillarFromCauseName(name: string): string {
  const n = (name || "").toLowerCase();
  if (/capacitor|breaker|contactor|electrical|power|wire|tripped/i.test(n)) return "Electrical";
  if (/filter|duct|blower|airflow|vent|ducting|clogged|dirty.*filter|evaporator.*coil/i.test(n)) return "Structural";
  if (/refrigerant|leak|charge|epa|chemical|low.*refrigerant/i.test(n)) return "Chemical";
  if (/compressor|coil|thermostat|motor|mechanical|control/i.test(n)) return "Mechanical";
  return "Mechanical";
}

/** Normalize grouped causes from raw — object keyed by system slug */
function normalizeGroupedCauses(raw: RawContent): GroupedCausesMap | null {
  const obj = raw?.groupedCauses ?? raw?.grouped_causes;
  if (typeof obj !== "object" || obj === null) return null;
  const out: GroupedCausesMap = {};
  let total = 0;
  for (const [key, arr] of Object.entries(obj)) {
    if (!Array.isArray(arr) || total >= 8) break;
    const slug = key.toLowerCase().replace(/\s+/g, "_");
    const causes: GroupedCauseCard[] = [];
    for (const item of arr.slice(0, 3)) {
      if (total >= 8) break;
      const o = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
      const name = toSafeString(o.name);
      const diagnose_slug = toSafeString(o.diagnose_slug);
      const repair_slug = toSafeString(o.repair_slug);
      if (!name || !diagnose_slug || !repair_slug) continue;
      const risk = toSafeString(o.risk);
      const likelihood = toSafeString(o.likelihood);
      causes.push({
        name,
        likelihood: (likelihood === "high" || likelihood === "medium" || likelihood === "low" ? likelihood : "medium") as "high" | "medium" | "low",
        risk: (risk === "high" || risk === "medium" || risk === "low" ? risk : "medium") as "low" | "medium" | "high",
        repair_difficulty: (toSafeString(o.repair_difficulty) === "easy" || toSafeString(o.repair_difficulty) === "moderate" || toSafeString(o.repair_difficulty) === "advanced"
          ? toSafeString(o.repair_difficulty) as "easy" | "moderate" | "advanced" : undefined),
        diy_safe: Boolean(o.diy_safe),
        urgency: (toSafeString(o.urgency) === "low" || toSafeString(o.urgency) === "medium" || toSafeString(o.urgency) === "high"
          ? toSafeString(o.urgency) as "low" | "medium" | "high" : undefined),
        why: toSafeString(o.why) ?? "",
        diagnose_slug,
        repair_slug,
        estimated_cost: toSafeString(o.estimated_cost) ?? "$50–$600",
      });
      total++;
    }
    if (causes.length > 0) out[slug] = causes;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Build grouped causes from rankedCauses — fallback when raw.groupedCauses missing */
function buildGroupedCausesFromRankedCauses(rankedCauses: RankedCauseCard[]): GroupedCausesMap {
  const byPillar = new Map<string, RankedCauseCard[]>();
  for (const c of rankedCauses) {
    const p = normalizePillar(c.pillar, c.name);
    if (!byPillar.has(p)) byPillar.set(p, []);
    byPillar.get(p)!.push(c);
  }
  const ordered = PILLAR_ORDER.filter((p) => byPillar.has(p));
  const others = Array.from(byPillar.keys()).filter((p) => !PILLAR_ORDER.includes(p));
  const pillars = [...ordered, ...others].slice(0, 4);
  const out: GroupedCausesMap = {};
  let total = 0;
  for (const pillar of pillars) {
    if (total >= 16) break;
    const causes = byPillar.get(pillar) ?? [];
    const slug = pillar.toLowerCase();
    const cards: GroupedCauseCard[] = causes.slice(0, 5).map((c) => {
      const r = (toSafeString(c.risk) ?? "").toLowerCase();
      const l = (toSafeString(c.likelihood) ?? "").toLowerCase();
      const risk = (r === "high" || r === "medium" || r === "low" ? r : "medium") as "low" | "medium" | "high";
      const likelihood = (l === "high" || l === "medium" || l === "low" ? l : "medium") as "high" | "medium" | "low";
      const diyFriendly = c.diy_friendly ?? c.difficulty;
      const diy_safe = diyFriendly === "easy" || diyFriendly === "rookie";
      return {
        name: c.name,
        likelihood,
        risk,
        repair_difficulty: diy_safe ? "easy" as const : (diyFriendly === "pro" || diyFriendly === "advanced" ? "advanced" as const : "moderate" as const),
        diy_safe,
        why: c.why ?? c.explanation ?? "",
        diagnose_slug: c.diagnose_slug ?? `diagnose-${slug}`,
        repair_slug: c.repair_slug ?? c.repairs?.[0]?.slug ?? "hvac-repair",
        estimated_cost: c.estimated_cost ?? c.cost ?? "$50–$600",
      };
    });
    if (cards.length > 0) {
      out[slug] = cards;
      total += cards.length;
    }
  }
  return out;
}

const DEFAULT_DISCLAIMER = "HVAC systems are complex and expensive. While some minor issues can be addressed safely, many repairs involve electrical or refrigerant components that require professional tools and certification.";

/** Normalize disclaimer, pillarBreakdown, repairDifficultyMatrix from raw */
function normalizePillarDiagnosticFields(raw: RawContent): {
  disclaimer: string;
  pillarBreakdown?: Record<string, Array<{ issue?: string; explanation?: string; warning?: string; diy_pro?: string }>>;
  repairDifficultyMatrix?: Record<string, Array<{ name: string; difficulty: string; color: "green" | "yellow" | "red"; cost_range: string }>>;
} {
  const disclaimer = toSafeString(raw?.disclaimer) ?? DEFAULT_DISCLAIMER;
  const pb = raw?.pillarBreakdown ?? raw?.pillar_breakdown;
  const rdm = raw?.repairDifficultyMatrix ?? raw?.repair_difficulty_matrix;
  let pillarBreakdown: Record<string, Array<{ issue?: string; explanation?: string; warning?: string; diy_pro?: string }>> | undefined;
  if (typeof pb === "object" && pb !== null) {
    pillarBreakdown = {};
    for (const [key, arr] of Object.entries(pb)) {
      if (!Array.isArray(arr)) continue;
      const items = arr.slice(0, 4).map((item: unknown) => {
        const o = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
        return {
          issue: toSafeString(o.issue),
          explanation: toSafeString(o.explanation),
          warning: toSafeString(o.warning),
          diy_pro: toSafeString(o.diy_pro),
        };
      }).filter((x) => x.issue || x.explanation);
      if (items.length > 0) pillarBreakdown[key] = items;
    }
  }
  let repairDifficultyMatrix: Record<string, Array<{ name: string; difficulty: string; color: "green" | "yellow" | "red"; cost_range: string }>> | undefined;
  if (typeof rdm === "object" && rdm !== null) {
    repairDifficultyMatrix = {};
    for (const [key, arr] of Object.entries(rdm)) {
      if (!Array.isArray(arr)) continue;
      const items = arr.map((item: unknown) => {
        const o = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
        const name = toSafeString(o.name);
        if (!name) return null;
        const color = toSafeString(o.color);
        const validColor = (color === "green" || color === "yellow" || color === "red") ? color : "yellow";
        return {
          name,
          difficulty: toSafeString(o.difficulty) ?? "moderate",
          color: validColor as "green" | "yellow" | "red",
          cost_range: toSafeString(o.cost_range) ?? "$50–$600",
        };
      }).filter(Boolean) as Array<{ name: string; difficulty: string; color: "green" | "yellow" | "red"; cost_range: string }>;
      if (items.length > 0) repairDifficultyMatrix[key] = items;
    }
  }
  return { disclaimer, pillarBreakdown, repairDifficultyMatrix };
}

/** Normalize diagnostic flow — Mermaid NOT rendered, steps only */
function normalizeDiagnosticFlow(raw: RawContent): DiagnosticFlowPlaceholderData {
  const steps: string[] = [];
  const ds = raw?.diagnostic_steps ?? raw?.diagnostics ?? raw?.diagnostic_tests;
  if (Array.isArray(ds) && ds.length > 0) {
    for (const s of ds) {
      if (typeof s === "string") steps.push(s);
      else if (typeof s === "object" && s !== null) {
        const o = s as Record<string, unknown>;
        const a = toSafeString(o.action ?? o.step);
        if (a) steps.push(a);
      }
    }
  }
  if (steps.length === 0 && Array.isArray(raw?.diagnosticFlow)) {
    for (const s of raw.diagnosticFlow as any[]) {
      if (typeof s === "string") steps.push(s);
      else if (s && typeof s === "object") {
        const title = s.question ?? s.title ?? s.step;
        if (title) steps.push(title);
      }
    }
  }
  if (steps.length === 0 && Array.isArray(raw?.diagnostic_tests)) {
    steps.push(...mapDiagnosticTests(raw.diagnostic_tests));
  }
  const mermaidSource = toSafeString(raw?.mermaid_graph ?? raw?.diagnostic_tree_mermaid);
  return {
    hasDiagram: !!mermaidSource,
    mermaidSource: mermaidSource ?? null,
    steps: steps.length > 0 ? steps : [
      "Verify thermostat is set to cool",
      "Replace dirty air filter",
      "Reset HVAC breaker",
      "Check outdoor condenser coil",
    ],
  };
}

/** Normalize FAQ — uses defensive normalizeFaqItems. LOCKED format: seo_faq */
function normalizeFaq(raw: RawContent): FAQItem[] {
  const fromFaq = normalizeFaqItems(raw?.faq);
  if (fromFaq.length > 0) return fromFaq;
  return normalizeFaqItems(raw?.seo_faq);
}

/** Normalize related links */
function normalizeRelatedLinks(links: unknown[] | undefined): RelatedLink[] {
  if (!Array.isArray(links)) return [];
  return links.map((l: unknown) => {
    const o = (typeof l === "object" && l !== null ? l : {}) as Record<string, unknown>;
    const url = toSafeString(o.url ?? o.slug);
    const label = toSafeString(o.label ?? o.title ?? o.name);
    if (!url) return null;
    return { url: url.startsWith("/") ? url : `/${url}`, label: label ?? url };
  }).filter(Boolean) as RelatedLink[];
}

/** Normalize most_common_fix (object or string) */
function normalizeMostCommonFixCard(raw: RawContent): MostCommonFixCard | undefined {
  const mcf = raw?.most_common_fix;
  if (typeof mcf === "object" && mcf !== null) {
    const o = mcf as Record<string, unknown>;
    const name = toSafeString(o.name);
    if (name) {
      return {
        name,
        description: toSafeString(o.description),
        cost: toSafeString(o.cost),
        difficulty: toSafeString(o.difficulty),
        diy: o.diy !== false,
      };
    }
  }
  return undefined;
}

/** Normalize guided_diagnosis_filters */
function normalizeGuidedFilters(raw: RawContent): { categories?: GuidedFilterCategory[] } | undefined {
  const gdf = raw?.guided_diagnosis_filters as { categories?: unknown[] } | undefined;
  if (!gdf?.categories || !Array.isArray(gdf.categories)) return undefined;
  const categories: GuidedFilterCategory[] = gdf.categories.map((c: unknown) => {
    const o = (typeof c === "object" && c !== null ? c : {}) as Record<string, unknown>;
    const opts = Array.isArray(o.options) ? o.options : [];
    return {
      name: toSafeString(o.name) ?? "",
      options: opts.map((opt: unknown) => {
        const optObj = (typeof opt === "object" && opt !== null ? opt : {}) as Record<string, unknown>;
        return {
          slug: toSafeString(optObj.slug ?? optObj.value) ?? "",
          label: toSafeString(optObj.label) ?? toSafeString(optObj.slug ?? optObj.value) ?? "",
        };
      }).filter((x) => x.slug),
    };
  }).filter((x) => x.name);
  return categories.length > 0 ? { categories } : undefined;
}

/** Normalize when_to_call_pro — LOCKED format: string or { warnings: [] } */
function normalizeWhenToCallProWarnings(raw: RawContent): WhenToCallWarning[] {
  const wtcp = raw?.when_to_call_pro;
  if (typeof wtcp === "string" && wtcp.trim()) {
    return [{ type: "Professional", description: wtcp.trim() }];
  }
  const obj = wtcp as { warnings?: unknown[] } | undefined;
  if (!Array.isArray(obj?.warnings)) return [];
  const defaults: WhenToCallWarning[] = [
    { type: "Electrical", description: "Contactors, capacitors, control boards require LOTO training." },
    { type: "Refrigerant", description: "EPA Section 608—illegal to vent or handle without license." },
    { type: "Gas", description: "Never modify furnace gas valves or heat exchangers." },
  ];
  const mapped = obj.warnings.map((w: unknown) => {
    const o = (typeof w === "object" && w !== null ? w : {}) as Record<string, unknown>;
    const type = toSafeString(o.type);
    const description = toSafeString(o.description);
    if (type && description) return { type, description };
    return null;
  }).filter(Boolean) as WhenToCallWarning[];
  return mapped.length > 0 ? mapped : defaults;
}

/** Normalize components (Parts Likely Involved) */
function normalizeComponents(raw: RawContent): ComponentLink[] {
  const arr = Array.isArray(raw?.components) ? raw.components : [];
  return arr.map((c: unknown) => {
    const o = (typeof c === "object" && c !== null ? c : {}) as Record<string, unknown>;
    const name = toSafeString(o.name);
    if (!name) return null;
    return {
      name,
      link: toSafeString(o.link),
      role: toSafeString(o.role),
    };
  }).filter(Boolean) as ComponentLink[];
}

/** Normalize components_for_fixes / fix_components */
function normalizeComponentsForFixes(raw: RawContent): ComponentForFix[] {
  const arr = Array.isArray(raw?.components_for_fixes) ? raw.components_for_fixes
    : Array.isArray(raw?.fix_components) ? raw.fix_components : [];
  if (arr.length === 0) return [];
  return arr.slice(0, 4).map((c: unknown) => {
    const o = (typeof c === "object" && c !== null ? c : {}) as Record<string, unknown>;
    return {
      name: toSafeString(o.name) ?? "",
      description: toSafeString(o.description ?? o.reason),
      link: toSafeString(o.link),
      proOnly: o.proOnly === true,
      affiliateUrl: (o.affiliateUrl as string) ?? null,
    };
  }).filter((x) => x.name);
}

/** Normalize tools_required */
function normalizeToolsRequired(raw: RawContent): ToolRequired[] {
  const arr = Array.isArray(raw?.tools_required) ? raw.tools_required : [];
  return arr.map((t: unknown) => {
    const o = (typeof t === "object" && t !== null ? t : {}) as Record<string, unknown>;
    return {
      name: toSafeString(o.name) ?? "",
      reason: toSafeString(o.reason ?? o.purpose),
      description: toSafeString(o.description ?? o.reason ?? o.purpose),
      affiliateUrl: (o.affiliateUrl as string) ?? null,
    };
  }).filter((x) => x.name);
}

/** Normalize prevention_tips / prevention */
function normalizePreventionTips(raw: RawContent): PreventionTip[] {
  const arr = Array.isArray(raw?.prevention_tips) ? raw.prevention_tips
    : Array.isArray(raw?.prevention) ? raw.prevention : [];
  return arr.map((p: unknown) => {
    const o = (typeof p === "object" && p !== null ? p : {}) as Record<string, unknown>;
    return {
      name: toSafeString(o.name) ?? "",
      description: toSafeString(o.description),
    };
  }).filter((x) => x.name);
}

/** Normalize affected_symptoms / commonSymptoms for cause pages */
function normalizeCommonSymptoms(raw: RawContent): BasePageViewModel["commonSymptoms"] {
  const arr = Array.isArray(raw?.affected_symptoms) ? raw.affected_symptoms
    : Array.isArray(raw?.commonSymptoms) ? raw.commonSymptoms : [];
  if (arr.length === 0) return undefined;
  const items = toObjectArray(arr).map((o) => ({
    name: toSafeString(o.name) ?? "",
    slug: toSafeString(o.slug),
    link: toSafeString(o.link) ?? (o.slug ? `/diagnose/${o.slug}` : undefined),
    description: toSafeString(o.description),
  })).filter((x) => x.name);
  return items.length > 0 ? items : undefined;
}

export interface NormalizePageDataInput {
  rawContent: RawContent;
  pageType: string;
  slug: string;
  title: string;
  /** Graph/DB causes when raw has none (symptom pages) */
  graphCauses?: unknown[];
  /** Graph/DB repairs when raw has none (cause pages) */
  graphRepairs?: Array<{ name?: string; slug?: string; repair_type?: string; skill_level?: string }>;
  /** Graph/DB tools when raw has none (repair pages) */
  graphTools?: Array<{ name?: string; slug?: string; description?: string }>;
  /** Legacy HTML from DB — stripped to plain text, NEVER rendered as HTML */
  legacyHtmlContent?: string | null;
}

/**
 * Normalize raw DB content into a typed PageViewModel.
 * This is the ONLY place that handles shape inconsistency.
 */
export function normalizePageData(input: NormalizePageDataInput): BasePageViewModel {
  const { pageType, slug, title, graphCauses, graphRepairs, graphTools, legacyHtmlContent } = input;
  
  let raw = input.rawContent;
  let relationshipsData = undefined;
  if (raw && typeof raw === 'object' && 'content' in raw && typeof (raw as any).content === 'object') {
    relationshipsData = (raw as any).relationships;
    raw = (raw as any).content as Record<string, unknown>;
  }

  const strippedLegacyHtml = legacyHtmlContent ? stripHtmlToText(legacyHtmlContent) : "";

  const bodyText = strippedLegacyHtml || undefined;

  const fastAnswer =
    toSafeString(raw?.quick_answer) ??
    toSafeString(raw?.fast_answer) ??
    toSafeString(raw?.fastAnswer) ??
    toSafeString(raw?.summary) ??
    toSafeString(raw?.problem_summary) ??
    toSafeString(raw?.content) ??
    (strippedLegacyHtml ? strippedLegacyHtml.slice(0, 500) : undefined);

  const summary30 =
    toSafeString(raw?.summary30 ?? raw?.summary_30) ??
    toSafeString(raw?.summary) ??
    toSafeString(raw?.summary_30_sec) ??
    toSafeString(raw?.problem_summary) ??
    toSafeString((raw?.hero as any)?.description) ??
    fastAnswer ??
    (strippedLegacyHtml ? strippedLegacyHtml.slice(0, 300) : undefined);

  const causesTable = normalizeCauses(raw, graphCauses);
  let repairOptions = normalizeRepairs(raw, graphCauses, graphRepairs);
  if (repairOptions.length === 0 && Array.isArray(raw?.systems)) {
    const seen = new Set<string>();
    for (const sys of raw.systems as unknown[]) {
      const so = sys as Record<string, unknown>;
      const issues = Array.isArray(so?.issues) ? so.issues : Array.isArray(so?.likely_issues) ? so.likely_issues : [];
      for (const i of issues as unknown[]) {
        const io = i as Record<string, unknown>;
        const repair = toSafeString(io?.fix ?? io?.repair);
        const diff = toSafeString(io?.difficulty);
        if (repair && !seen.has(repair)) {
          seen.add(repair);
          repairOptions.push({
            name: repair,
            difficulty: diff,
            cost: "",
            estimated_cost: "",
            fix_summary: undefined,
            explanation: undefined,
            link: undefined,
            slug: undefined,
            id: undefined,
          });
        }
      }
    }
  }
  if (repairOptions.length === 0 && Array.isArray(raw?.repairOptions) && raw.repairOptions.length > 0) {
    repairOptions = (raw.repairOptions as unknown[]).map((r: unknown) => {
      const o = (typeof r === "object" && r !== null ? r : {}) as Record<string, unknown>;
      return {
        name: toSafeString(o.name) ?? "Unknown",
        difficulty: toSafeString(o.difficulty),
        cost: toSafeString(o.cost ?? o.estimated_cost),
        estimated_cost: toSafeString(o.cost ?? o.estimated_cost),
        fix_summary: undefined,
        explanation: undefined,
        link: undefined,
        slug: undefined,
        id: undefined,
      };
    });
  }
  const rankedCauses = buildRankedCauses(causesTable, repairOptions, raw ?? undefined);

  const diagnosticFlow = normalizeDiagnosticFlow(raw ?? undefined);
  const faq = normalizeFaq(raw);
  const relatedLinks = normalizeRelatedLinks(raw?.relatedLinks as unknown[] | undefined);

  const getChecklist = (data: any) => {
    if (Array.isArray(data?.quickChecks) && data.quickChecks.length > 0) {
      return data.quickChecks.map((s: any) => typeof s === "string" ? s : s.title ?? s.instruction).filter(Boolean);
    }
    if (Array.isArray(data?.diagnostic_flow) && data.diagnostic_flow.length > 0) {
      return data.diagnostic_flow.map((s: any) => typeof s === "string" ? s : s.title).filter(Boolean);
    }
    if (Array.isArray(data?.narrow_down) && data.narrow_down.length > 0) {
      return data.narrow_down.map((s: any) => typeof s === "string" ? s : s.question || s.title || s.step).filter(Boolean);
    }
    if (Array.isArray(data?.conditions) && data.conditions.length > 0) {
      return data.conditions;
    }
    return [
      "Verify thermostat is set to cool and set below room temperature",
      "Replace dirty air filter — a clogged filter is the #1 cause of reduced airflow",
      "Reset the HVAC breaker at the panel and wait 30 seconds before restarting",
      "Check outdoor condenser coil for debris, ice, or blockage",
    ];
  };
  const checklist = getChecklist(raw);

  const whenToCallProWarnings = normalizeWhenToCallProWarnings(raw ?? undefined);
  const warnings = whenToCallProWarnings.map((w) => `${w.type}: ${w.description}`);
  const components = normalizeComponents(raw ?? undefined);
  const componentsForFixes = normalizeComponentsForFixes(raw ?? undefined);
  let toolsRequired = normalizeToolsRequired(raw ?? undefined);
  if (toolsRequired.length === 0 && Array.isArray(raw?.toolsRequired) && (raw.toolsRequired as unknown[]).every((x) => typeof x === "string")) {
    toolsRequired = (raw.toolsRequired as string[]).map((s) => ({
      name: s.trim(),
      reason: undefined,
      description: undefined,
      affiliateUrl: null,
    })).filter((x) => x.name);
  }
  if (toolsRequired.length === 0 && Array.isArray(graphTools) && graphTools.length > 0) {
    toolsRequired = graphTools.map((t) => ({
      name: toSafeString(t.name) ?? "",
      reason: toSafeString(t.description),
      description: toSafeString(t.description),
      affiliateUrl: null,
    })).filter((x) => x.name);
  }
  const preventionTips = normalizePreventionTips(raw ?? undefined);
  const partsNeededRaw = raw?.parts_required ?? raw?.partsRequired ?? raw?.partsNeeded;
  const partsNeeded = Array.isArray(partsNeededRaw) && partsNeededRaw.every((x) => typeof x === "string")
    ? (partsNeededRaw as string[]).map((s) => ({ name: s.trim(), description: undefined })).filter((x) => x.name)
    : normalizeToolOrPartItems(partsNeededRaw);
  const repairStepsOverviewRaw = raw?.step_overview ?? raw?.repair_steps ?? raw?.repairStepsOverview ?? raw?.stepsOverview ?? raw?.stepByStep;
  const repairStepsOverview = Array.isArray(repairStepsOverviewRaw) && repairStepsOverviewRaw.every((x) => typeof x === "string")
    ? (repairStepsOverviewRaw as string[]).map((s, i) => ({ step: i + 1, action: s.trim(), description: s.trim() })).filter((x) => x.action)
    : normalizeRepairSteps(repairStepsOverviewRaw);
  const whenNotToDiy = toStringArray(raw?.when_not_to_diy ?? raw?.whenNotToDiy ?? raw?.safety_warnings ?? raw?.whenToCallPro ?? raw?.safetyWarnings);

  const sections: Record<string, unknown> = {};
  if (raw?.sections && typeof raw.sections === "object" && Object.keys(raw.sections as object).length > 0) {
    Object.assign(sections, raw.sections);
  } else {
    sections.fast_answer = { summary: fastAnswer, likely_cause: fastAnswer };
    sections.causes = { items: rankedCauses };
    sections.repairs = { items: repairOptions };
    sections.diagnostic_flow = { steps: diagnosticFlow.steps };
  }
  if (raw?.cost_of_delay) sections.cost_of_delay = raw.cost_of_delay;
  if (Array.isArray(raw?.components_for_fixes) && raw.components_for_fixes.length > 0) sections.components_for_fixes = raw.components_for_fixes;
  if (Array.isArray(raw?.fix_components) && raw.fix_components.length > 0) sections.fix_components = raw.fix_components;

  const displayTitle = titleCase(title || toSafeString((raw?.hero as any)?.headline) || toSafeString(raw?.title) || slug || "");
  return {
    pageType: (pageType as BasePageViewModel["pageType"]) ?? "symptom",
    slug,
    title: displayTitle || title,
    relationships: relationshipsData as any,
    metaTitle: toSafeString(raw?.meta_title) ?? displayTitle,
    metaDescription: toSafeString(raw?.meta_description) ?? fastAnswer ?? summary30,
    intro: summary30,
    fastAnswer,
    summary30,
    sections,
    causesTable,
    rankedCauses,
    repairOptions,
    diagnosticFlow: Array.isArray(raw?.diagnosticFlow) ? raw.diagnosticFlow : diagnosticFlow,
    faq,
    relatedLinks,
    warnings,
    technicianStatement:
      toSafeString(raw?.technician_statement) ??
      toSafeString(raw?.field_note) ??
      toSafeString(raw?.field_notes),
    mostCommonFix: typeof raw?.most_common_fix === "string" ? toSafeString(raw.most_common_fix) : undefined,
    mostCommonFixCard: normalizeMostCommonFixCard(raw ?? undefined),
    checklist,
    guidedFilters: normalizeGuidedFilters(raw ?? undefined),
    whenToCallProWarnings: whenToCallProWarnings.length > 0 ? whenToCallProWarnings : undefined,
    components: components.length > 0 ? components : undefined,
    componentsForFixes: componentsForFixes.length > 0 ? componentsForFixes : undefined,
    toolsRequired: toolsRequired.length > 0 ? toolsRequired : undefined,
    costOfDelay: toSafeString(raw?.cost_of_delay),
    preventionTips: preventionTips.length > 0 ? preventionTips : undefined,
    layout: toSafeString(raw?.layout),
    technicianInsights: Array.isArray(raw?.technician_insights) ? raw.technician_insights : undefined,
    commonMistakes: (() => {
      const cm = raw?.common_mistakes ?? raw?.commonMistakes;
      if (!Array.isArray(cm)) return undefined;
      if (cm.every((x) => typeof x === "string")) {
        return (cm as string[]).map((s) => ({ name: s.trim(), description: s.trim(), time: undefined })).filter((x) => x.name);
      }
      return cm.map((m: unknown) => {
        const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>;
        return { name: toSafeString(o.name) ?? "", description: toSafeString(o.description), time: toSafeString(o.time) };
      }).filter((x) => x.name);
    })(),
    environmentConditions: Array.isArray(raw?.environment_conditions) ? (raw.environment_conditions as unknown[]).map((e: unknown) => {
      const o = (typeof e === "object" && e !== null ? e : {}) as Record<string, unknown>;
      return { name: toSafeString(o.name) ?? "", description: toSafeString(o.description) };
    }) : undefined,
    schemaJson: (raw?.schema_json as Record<string, unknown>) ?? undefined,
    decisionTree: (typeof (raw?.decision_tree ?? raw?.mermaid_graph ?? raw?.diagnosticFlowMermaid) === 'object' && (raw?.decision_tree ?? raw?.mermaid_graph ?? raw?.diagnosticFlowMermaid) !== null)
      ? (raw?.decision_tree ?? raw?.mermaid_graph ?? raw?.diagnosticFlowMermaid) as Record<string, unknown>
      : toSafeString(raw?.decision_tree ?? raw?.mermaid_graph ?? raw?.diagnosticFlowMermaid) ?? null,
    diagnosticFlowMermaid: toSafeString(raw?.diagnosticFlowMermaid ?? raw?.diagnostic_flow_mermaid ?? raw?.diagnostic_tree_mermaid ?? raw?.mermaid_graph) ?? null,
    causeConfirmationMermaid: toSafeString(raw?.causeConfirmationMermaid ?? raw?.cause_confirmation_mermaid) ?? null,
    repairFlowMermaid: toSafeString(raw?.repairFlowMermaid ?? raw?.repair_flow_mermaid) ?? null,
    systemCards: (() => {
      const fromRaw = normalizeSystemCards(raw ?? {});
      if (fromRaw && fromRaw.length >= 4) return fromRaw;
      return buildSystemCardsFromRankedCauses(rankedCauses);
    })(),
    groupedCauses: (() => {
      const fromRaw = normalizeGroupedCauses(raw ?? {});
      if (fromRaw && Object.keys(fromRaw).length > 0) return fromRaw;
      return buildGroupedCausesFromRankedCauses(rankedCauses);
    })(),
    ...((): { disclaimer: string; pillarBreakdown?: Record<string, Array<{ issue?: string; explanation?: string; warning?: string; diy_pro?: string }>>; repairDifficultyMatrix?: Record<string, Array<{ name: string; difficulty: string; color: "green" | "yellow" | "red"; cost_range: string }>> } => {
      const pd = normalizePillarDiagnosticFields(raw ?? {});
      const grouped = (() => {
        const fromRaw = normalizeGroupedCauses(raw ?? {});
        if (fromRaw && Object.keys(fromRaw).length > 0) return fromRaw;
        return buildGroupedCausesFromRankedCauses(rankedCauses);
      })();
      let pillarBreakdown = pd.pillarBreakdown;
      let repairDifficultyMatrix = pd.repairDifficultyMatrix;
      if ((!pillarBreakdown || Object.keys(pillarBreakdown).length === 0) && grouped && Object.keys(grouped).length > 0) {
        pillarBreakdown = {};
        for (const [slug, causes] of Object.entries(grouped)) {
          pillarBreakdown[slug] = causes.slice(0, 4).map((c) => ({
            issue: c.name,
            explanation: c.why,
            warning: !c.diy_safe ? "Professional recommended" : undefined,
            diy_pro: c.diy_safe ? "DIY" : "Pro",
          }));
        }
      }
      if ((!repairDifficultyMatrix || Object.keys(repairDifficultyMatrix).length === 0) && grouped && Object.keys(grouped).length > 0) {
        repairDifficultyMatrix = {};
        for (const [slug, causes] of Object.entries(grouped)) {
          repairDifficultyMatrix[slug] = causes.slice(0, 4).map((c) => ({
            name: c.name,
            difficulty: c.repair_difficulty ?? "moderate",
            color: (c.diy_safe ? "green" : c.risk === "high" ? "red" : "yellow") as "green" | "yellow" | "red",
            cost_range: c.estimated_cost ?? "$50–$600",
          }));
        }
      }
      return {
        disclaimer: pd.disclaimer,
        pillarBreakdown,
        repairDifficultyMatrix,
      };
    })(),
    bodyText,
    commonSymptoms: normalizeCommonSymptoms(raw),
    partsNeeded: partsNeeded.length > 0 ? partsNeeded : undefined,
    repairStepsOverview: repairStepsOverview.length > 0 ? repairStepsOverview : undefined,
    whenNotToDiy: whenNotToDiy.length > 0 ? whenNotToDiy : undefined,
    whatThisFixes: toSafeString(raw?.whatThisFixes ?? raw?.what_this_fixes ?? raw?.repairOverview),
    whenToUse: (() => { const a = toStringArray(raw?.whenToUse ?? raw?.when_to_use); return a.length > 0 ? a : undefined; })(),
    timeRequired: (() => {
      const t = raw?.timeRequired ?? raw?.time_required;
      if (typeof t === "string" && t) return t;
      const te = raw?.timeEstimate as { diy?: string; professional?: string } | undefined;
      if (te && typeof te === "object" && (te.diy || te.professional)) {
        const parts = [te.diy && `DIY: ${te.diy}`, te.professional && `Pro: ${te.professional}`].filter(Boolean);
        return parts.length > 0 ? parts.join(" | ") : undefined;
      }
      return undefined;
    })(),
    riskLevel: toSafeString(raw?.riskLevel ?? raw?.risk_level),
    difficulty: (() => {
      const d = raw?.difficulty;
      if (typeof d === "object" && d !== null) {
        const o = d as { level?: string; reason?: string };
        if (o.level) return { level: o.level, reason: toSafeString(o.reason) };
      }
      return undefined;
    })(),
    costRepair: (() => {
      const c = raw?.cost ?? raw?.costEstimate;
      if (typeof c !== "object" || c === null) return undefined;
      const o = c as Record<string, unknown>;
      const diy = toSafeString(o.diy);
      const professional = toSafeString(o.professional);
      if (diy && professional) return { diy, professional };
      return undefined;
    })(),
    relatedSymptoms: (() => { const a = toStringArray(raw?.relatedSymptoms ?? raw?.related_symptoms); return a.length > 0 ? a : undefined; })(),
    relatedCauses: (() => { const a = toStringArray(raw?.relatedCauses ?? raw?.related_causes); return a.length > 0 ? a : undefined; })(),
    
    // Phase 44: Deep Diagnostic 11-Block map
    hero: (typeof raw?.hero === 'object' && raw?.hero !== null) ? raw.hero as any : undefined,
    quickAnswersData: Array.isArray(raw?.quickAnswer) && raw.quickAnswer.length > 0 ? raw.quickAnswer as any : undefined,
    diagnosticFlowData: Array.isArray(raw?.diagnosticFlow) && raw.diagnosticFlow.length > 0 ? raw.diagnosticFlow as any : undefined,
    causesData: Array.isArray(raw?.causes) && raw.causes.length > 0 ? raw.causes as any : undefined,
    fixesData: Array.isArray(raw?.fixes) && raw.fixes.length > 0 ? raw.fixes as any : undefined,
    costBreakdown: (typeof raw?.costBreakdown === 'object' && raw?.costBreakdown !== null) ? raw.costBreakdown as any : undefined,
    preventionData: (typeof raw?.prevention === 'object' && raw?.prevention !== null) ? raw.prevention as any : undefined,
    warningSigns: (typeof raw?.warningSigns === 'object' && raw?.warningSigns !== null) ? raw.warningSigns as any : undefined,
    cta: (typeof raw?.cta === 'object' && raw?.cta !== null) ? raw.cta as any : undefined,
    internalLinksData: Array.isArray(raw?.internalLinks) && raw.internalLinks.length > 0 ? raw.internalLinks as any : undefined,
  };
}
