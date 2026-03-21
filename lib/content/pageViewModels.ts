/**
 * Page View Models — Unified Typed Contract
 * -----------------------------------------
 * Single normalized interface pattern shared by all page types.
 * DB JSON → normalizePageData → PageViewModel → React sections
 *
 * @see docs/MASTER-PROMPT-DECISIONGRID.md
 */

export type PageType = "symptom" | "cause" | "repair" | "condition" | "component" | "system";

/** Single cause row for tables/cards */
export interface CauseSummaryRow {
  name: string;
  indicator?: string;
  explanation?: string;
  difficulty?: string;
  difficultyColor?: string;
  cost?: string;
  diyFriendly?: string;
}

/** Ranked cause with nested repairs (legacy) or card-grid fields (new) */
export interface RankedCauseCard {
  name: string;
  indicator?: string;
  explanation?: string;
  symptoms?: string;
  difficulty?: string;
  difficultyColor?: string;
  cost?: string;
  repairs: RepairOptionCard[];
  /** Card grid: likelihood (high/medium/low) */
  likelihood?: string;
  /** Card grid: risk (low=green, medium=yellow, high=red) */
  risk?: string;
  /** Card grid: 25–30 word explanation */
  why?: string;
  /** Card grid: diagnose page slug */
  diagnose_slug?: string;
  /** Card grid: repair page slug */
  repair_slug?: string;
  /** Card grid: estimated cost */
  estimated_cost?: string;
  /** Pillar: Ducting|Electrical|Refrigeration|Structural|Controls */
  pillar?: string;
  /** Faulty item: e.g. filter, capacitor, coils */
  faulty_item?: string;
  /** DIY friendly: easy|moderate|pro */
  diy_friendly?: string;
  /** Ranking: relationship weight (0–1) */
  weight?: number;
  /** Ranking: frequency (0–1) */
  frequency?: number;
  /** Ranking: severity (0–1) */
  severity?: number;
  /** Ranking: system match (0–1) */
  system_match?: number;
}

/** System card — pillar-level conversion funnel (4 cards only) */
export interface SystemCardData {
  system: string;
  summary: string;
  common_causes?: string[];
  why?: string;
  risk_level: "low" | "medium" | "high";
  diy_safe?: boolean;
  diy_range?: string;
  cost_range?: string;
  why_not_diy?: string;
  warning?: string;
  diagnose_slug: string;
  repair_slug: string;
}

/** Grouped cause card — detailed cause within a system (2–3 per system, ≤8 total) */
export interface GroupedCauseCard {
  name: string;
  likelihood: "high" | "medium" | "low";
  risk: "low" | "medium" | "high";
  repair_difficulty?: "easy" | "moderate" | "advanced";
  diy_safe: boolean;
  urgency?: "low" | "medium" | "high";
  why: string;
  diagnose_slug: string;
  repair_slug: string;
  estimated_cost: string;
}

/** Grouped causes by system slug — electrical, airflow, refrigeration, etc. */
export type GroupedCausesMap = Record<string, GroupedCauseCard[]>;

/** Single repair option */
export interface RepairOptionCard {
  name: string;
  difficulty?: string;
  cost?: string;
  estimated_cost?: string;
  fix_summary?: string;
  explanation?: string;
  link?: string;
  slug?: string;
  id?: string;
}

/** Guided diagnosis filter group */
export interface GuidedFilterGroup {
  label?: string;
  options?: Array<{ value: string; label: string }>;
}

/** Guided filters — categories with options (Narrow Down the Problem) */
export interface GuidedFilterCategory {
  name: string;
  options: Array<{ slug: string; label: string }>;
}

/** Most common fix card (object shape) */
export interface MostCommonFixCard {
  name: string;
  description?: string;
  cost?: string;
  difficulty?: string;
  diy?: boolean;
}

/** When to call pro — structured warning */
export interface WhenToCallWarning {
  type: string;
  description: string;
}

/** Component/part for fixes (Components for Fixes section) */
export interface ComponentForFix {
  name: string;
  description?: string;
  link?: string;
  proOnly?: boolean;
  affiliateUrl?: string | null;
}

/** Part/component link (Parts Likely Involved section) */
export interface ComponentLink {
  name: string;
  link?: string;
  role?: string;
}

/** Tool required for diagnosis */
export interface ToolRequired {
  name: string;
  reason?: string;
  description?: string;
  affiliateUrl?: string | null;
}

/** Prevention tip */
export interface PreventionTip {
  name: string;
  description?: string;
}

/** Diagnostic step for Master Prompt json output */
export interface DiagnosticStep {
  step: number;
  question: string;
  yes: { action: string; next_step?: number; likely_cause?: string };
  no: { action: string; next_step?: number; likely_cause?: string };
}

/** Diagnostic flow placeholder (Mermaid disabled for now) */
export interface DiagnosticFlowPlaceholderData {
  hasDiagram: boolean;
  /** Raw mermaid string — NOT rendered on frontend */
  mermaidSource?: string | null;
  /** Human-readable steps when diagram unavailable */
  steps: string[];
}


/** FAQ item */
export interface FAQItem {
  question: string;
  answer: string;
}

/** Related link */
export interface RelatedLink {
  url: string;
  label: string;
}

/** Section key → safe data for that section */
export type RenderSectionMap = Partial<Record<string, unknown>>;

export interface BasePageViewModel {
  pageType: PageType;
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  intro?: string;
  fastAnswer?: string;
  summary30?: string;
  sections: RenderSectionMap;
  filters?: GuidedFilterGroup[];
  causesTable?: CauseSummaryRow[];
  rankedCauses?: RankedCauseCard[];
  repairOptions?: RepairOptionCard[];
  diagnosticFlow?: DiagnosticStep[] | DiagnosticFlowPlaceholderData | null;
  faq?: FAQItem[];
  relatedLinks?: RelatedLink[];
  warnings?: string[];
  technicianStatement?: string;
  /** String fallback when object not available */
  mostCommonFix?: string;
  /** Structured most common fix card */
  mostCommonFixCard?: MostCommonFixCard;
  checklist?: string[];
  technicianInsights?: Array<string | { text: string; cite?: string }>;
  commonMistakes?: Array<{ name: string; description?: string; time?: string }>;
  environmentConditions?: Array<{ name: string; description?: string }>;
  /** JSON-LD schema for SEO */
  schemaJson?: Record<string, unknown>;
  /** Strict mapped decision tree from graph or graph output */
  decisionTree?: string | Record<string, unknown> | null;
  /** Diagram 1: Primary diagnostic triage — narrow symptom to likely causes */
  diagnosticFlowMermaid?: string | null;
  /** Diagram 2: Cause confirmation — verify which cause fits, route to repair */
  causeConfirmationMermaid?: string | null;
  /** System cards — 4–5 pillar-level conversion funnels (Airflow, Electrical, etc.) */
  systemCards?: SystemCardData[];
  /** Grouped cause cards by system — 2–3 causes per system, ≤8 total */
  groupedCauses?: GroupedCausesMap;
  /** Disclaimer block — required for pillar diagnostic pages */
  disclaimer?: string;
  /** Pillar breakdown — bullets per system (issue, explanation, warning, diy_pro) */
  pillarBreakdown?: Record<string, Array<{ issue?: string; explanation?: string; warning?: string; diy_pro?: string }>>;
  /** Repair difficulty matrix — grouped by system, color-coded */
  repairDifficultyMatrix?: Record<string, Array<{ name: string; difficulty: string; color: "green" | "yellow" | "red"; cost_range: string }>>;
  /** Diagram 3: Repair flow — repair decision/sequence (repair pages only) */
  repairFlowMermaid?: string | null;
  /** Guided filters (Narrow Down the Problem) */
  guidedFilters?: { categories?: GuidedFilterCategory[] };
  /** When to call pro — structured warnings */
  whenToCallProWarnings?: WhenToCallWarning[];
  /** Parts likely involved (links to component pages) */
  components?: ComponentLink[];
  /** Components for fixes (affiliate grid) */
  componentsForFixes?: ComponentForFix[];
  /** Tools required for diagnosis */
  toolsRequired?: ToolRequired[];
  /** Cost of delay / what happens if you ignore */
  costOfDelay?: string;
  /** Prevention tips */
  preventionTips?: PreventionTip[];
  /** Layout key for canary (diagnostic_first, etc.) */
  layout?: string;
  /** Stripped plain text from legacy HTML — NEVER render raw HTML from DB */
  bodyText?: string;
  /** Symptoms this cause creates (cause pages) */
  commonSymptoms?: Array<{ name: string; slug?: string; link?: string; description?: string }>;
  /** Repair pages: parts needed */
  partsNeeded?: Array<{ name: string; description?: string }>;
  /** Repair pages: step overview */
  repairStepsOverview?: Array<{ step?: number; action: string; description?: string }>;
  /** Repair pages: when not to DIY */
  whenNotToDiy?: string[];
  /** Repair pages: what this repair fixes */
  whatThisFixes?: string;
  /** Repair pages: when to use this repair (triggers) */
  whenToUse?: string[];
  /** Repair pages: time required */
  timeRequired?: string;
  /** Repair pages: risk level */
  riskLevel?: string;
  /** Repair pages: difficulty (level + reason) */
  difficulty?: { level: string; reason?: string };
  /** Repair pages: cost breakdown */
  costRepair?: { diy: string; professional: string };
  /** Repair pages: related symptom slugs */
  relatedSymptoms?: string[];
  /** Repair pages: related cause slugs */
  relatedCauses?: string[];
}
