import { z } from "zod";

export const DiagnosticPageSchema = z.object({
  layout: z.string().optional(),
  schemaVersion: z.string().optional(),
  headline: z.string(),

  summary: z.object({
    whats_happening: z.string(),
    most_likely_cause: z.string(),
    immediate_action: z.string()
  }),

  quick_checks: z.array(z.string()),
  symptoms: z.array(z.string()),

  likely_causes: z.array(
    z.object({
      cause: z.string(),
      probability: z.string(),
      description: z.string()
    })
  ),

  diagnostic_flow: z.object({
    mermaid_code: z.string(),
    steps_summary: z.array(z.string()),
    stop_diy_boundary: z.string()
  }),

  risk_if_ignored: z.string(),

  repair_vs_replace: z.object({
    repair_cost_low: z.number(),
    repair_cost_high: z.number(),
    replace_cost_low: z.number(),
    replace_cost_high: z.number(),
    when_to_repair: z.string(),
    when_to_replace: z.string()
  }),

  local_cta: z.object({
    hook_text: z.string(),
    urgency_text: z.string(),
    reassurance: z.string(),
    button_text: z.string()
  }),

  internal_links: z.array(
    z.object({
      anchor_text: z.string(),
      slug: z.string(),
      relation: z.enum(["cause", "symptom", "repair", "system"])
    })
  ),

  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string()
    })
  )
});