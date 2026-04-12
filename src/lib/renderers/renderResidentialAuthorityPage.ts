type JsonRecord = Record<string, any>;

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export type ResidentialAuthorityViewModel = {
  title: string;
  subtitle: string;
  introHtml: string;
  summary30s: {
    what_it_usually_means: string;
    most_likely_causes: string[];
    urgency_level: string;
    first_safe_actions: string[];
  };
  safeChecks: Array<{ check: string; what_to_look_for: string; what_it_may_mean?: string; when_to_stop?: string }>;
  quickDecisionTree: Array<{ step: string | number; question: string; yes_path: string; no_path: string }>;
  systemExplanation: string;
  diagnosticFlow: Array<{ step: number | string; label: string; purpose: string; homeowner_safe?: boolean }>;
  topCauses: Array<{
    category?: string;
    cause: string;
    what_it_is?: string;
    why_it_causes_this_symptom?: string;
    common_signs?: string;
    typical_fix?: string;
    urgency?: string;
    estimated_cost_band?: string;
  }>;
  repairMatrix: Array<{
    symptom_pattern: string;
    likely_issue: string;
    typical_fix: string;
    urgency: string;
    rough_cost: string;
  }>;
  replaceVsRepair: {
    when_repair_makes_sense: string;
    when_replacement_should_be_considered: string;
    homeowner_takeaway: string;
  };
  tools: Array<{ tool: string; use: string; homeowner_safe?: boolean }>;
  whenToCallPro: string[];
  faq: Array<{ question: string; answer: string }>;
  internalLinks: Array<{ target_topic: string; anchor: string; reason?: string }>;
  cta: {
    primary: string;
    urgency_line: string;
  };
};

export function mapResidentialAuthorityJsonToViewModel(input: JsonRecord): ResidentialAuthorityViewModel {
  const root = input?.payload && typeof input.payload === "object" ? input.payload : input;

  return {
    title: asString(root.title || root.hero?.title || input.title),
    subtitle: asString(root.subtitle || root.hero?.subtitle || input.subtitle),
    introHtml: asString(root.intro || input.intro),
    summary30s: {
        what_it_usually_means: asString(root.summary_30s?.what_it_usually_means),
        most_likely_causes: asArray(root.summary_30s?.most_likely_causes),
        urgency_level: asString(root.summary_30s?.urgency_level),
        first_safe_actions: asArray(root.summary_30s?.first_safe_actions),
    },
    safeChecks: asArray(root.safe_checks),
    quickDecisionTree: asArray(root.decision_tree),
    systemExplanation: asString(root.systemExplanation || root.system_explanation),
    diagnosticFlow: asArray(root.diagnosticFlow?.steps || root.diagnosticFlow),
    topCauses: asArray(root.commonCauses || root.causes),
    repairMatrix: asArray(root.repair_matrix || root.repairMatrix),
    replaceVsRepair: {
        when_repair_makes_sense: asString(root.replace_vs_repair?.when_repair_makes_sense),
        when_replacement_should_be_considered: asString(root.replace_vs_repair?.when_replacement_should_be_considered),
        homeowner_takeaway: asString(root.replace_vs_repair?.homeowner_takeaway),
    },
    tools: asArray(root.toolsNeeded || root.quick_repair_toolkit),
    whenToCallPro: asArray(root.when_to_call_pro),
    faq: asArray(root.faq),
    internalLinks: asArray(root.internal_links),
    cta: {
      primary: asString(root.cta?.primary || root.cta?.button_text, "Book HVAC Service"),
      urgency_line: asString(root.cta?.urgency_line || root.cta?.title, "Need Help Fast?"),
    },
  };
}
