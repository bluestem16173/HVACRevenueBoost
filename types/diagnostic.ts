export interface DiagnosticData {
  ai_summary: {
    bullets: string[];
    most_likely_issue: string;
  };

  system_flow: string;
  diagnostic_flow: string;

  critical_thresholds?: {
    metric: string;
    normal_range: string;
    problem_range: string;
  }[];

  quick_diagnosis?: {
    symptom: string;
    likely_cause: string;
    action: string;
  }[];

  causes: {
    name: string;
    probability: "High" | "Medium" | "Low" | string;
    description: string;
    quick_fix: string;
  }[];

  deep_causes: {
    cause: string;
    why_it_happens: string;
    fix_steps: string[];
    tools_needed: string[];
  }[];

  tools?: {
    name: string;
    purpose: string;
  }[];

  before_calling_tech?: string[];

  cost?: {
    low: string;
    medium: string;
    high: string;
  };
}
