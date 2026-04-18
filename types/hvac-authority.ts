import { z } from "zod";
import { GENERATED_PAGE_LAYOUT } from "@/lib/generated-page-json-contract";

export const HVACAuthorityPageSchema = z.object({
  layout: z.literal(GENERATED_PAGE_LAYOUT),
  page_type: z.literal("diagnostic"),
  schema_version: z.string(),
  slug: z.string(),
  title: z.string(),
  h1: z.string(),
  meta_title: z.string(),
  meta_description: z.string(),
  canonical_path: z.string(),
  intro: z.string(),

  summary_30s: z.object({
    label: z.string(),
    overview: z.string().optional(),
    bullets: z.array(z.string()).min(3)
  }),

  immediate_quick_checks: z.array(
    z.object({
      step_number: z.number(),
      instruction: z.string(),
      why_it_matters: z.string()
    })
  ).min(3),

  diy_tools: z.array(
    z.object({
      tool: z.string(),
      purpose: z.string(),
      safe_for_basic_diy: z.boolean(),
      caution_note: z.string()
    })
  ).min(2),

  high_risk_warning: z.object({
    severity: z.enum(["medium", "high", "critical"]),
    title: z.string(),
    body: z.string(),
    risk_points: z.array(z.string()).min(2),
    show_emergency_cta: z.boolean()
  }),

  emergency_cta: z.object({
    title: z.string(),
    body: z.string(),
    button_text: z.string(),
    urgency_note: z.string()
  }),

  most_common_causes: z.array(
    z.object({
      cause: z.string(),
      probability_note: z.string(),
      explanation: z.string(),
      signs: z.array(z.string()).min(1)
    })
  ).length(4), // Forced exactly 4 per spec

  how_the_system_works: z.object({
    overview: z.string(),
    components: z.array(z.string()).min(3)
  }),

  advanced_diagnostic_flow: z.array(
    z.object({
      step_number: z.number(),
      title: z.string(),
      check: z.string(),
      normal_result: z.string(),
      danger_or_fail_result: z.string(),
      next_action: z.string()
    })
  ).min(3),

  mermaid_diagram: z.object({
    title: z.string(),
    code: z.string()
  }),

  repair_matrix: z.array(
    z.object({
      symptom: z.string(),
      likely_issue: z.string(),
      fix_type: z.string(),
      difficulty: z.string(),
      estimated_cost: z.string()
    })
  ).min(2),

  repair_vs_replace: z.object({
    repair_when: z.string(),
    replace_when: z.string(),
    decision_note: z.string()
  }),

  when_to_stop_diy: z.object({
    title: z.string(),
    intro: z.string(),
    danger_points: z.array(z.string()).min(3),
    conversion_body: z.string(),
    cta_text: z.string()
  }),

  prevention_tips: z.array(z.string()).min(2),

  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string()
    })
  ).min(4).max(6),

  internal_links: z.object({
    related_symptoms: z.array(z.string()),
    related_system_pages: z.array(z.string()),
    pillar_page: z.string()
  }),

  bottom_cta: z.object({
    title: z.string(),
    body: z.string(),
    urgency_bullets: z.array(z.string()).min(2),
    button_text: z.string()
  }),

  author_note: z.string()
});

export type HVACAuthorityPage = z.infer<typeof HVACAuthorityPageSchema>;
