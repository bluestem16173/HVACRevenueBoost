/**
 * Zod validators for each page type schema.
 * Matches prompts/symptom.ts, prompts/cause.ts, etc.
 */

import { z } from "zod";
import type { PageType } from "@/lib/page-types";

// --- Shared fragments ---

const linkItem = z.object({
  name: z.string(),
  link: z.string().optional(),
  description: z.string().optional(),
});

const faqItem = z.object({
  question: z.string(),
  answer: z.string(),
});

const costEstimate = z.object({
  level: z.string(),
  range: z.string(),
  examples: z.string().optional(),
  bg: z.string().optional(),
  border: z.string().optional(),
  textColor: z.string().optional(),
});

const whenToCallPro = z.object({
  warnings: z.array(z.object({
    type: z.string().optional(),
    description: z.string(),
  })).optional(),
});

// --- Symptom / Diagnostic (shared shape) ---

export const symptomSchema = z.object({
  fast_answer: z.string().optional(),
  diagnostic_overview: z.string().optional(),
  quick_diagnostic_checklist: z.array(z.string()).optional(),
  diagnostic_tree_mermaid: z.string().optional(),
  step_by_step_troubleshooting: z.array(z.object({
    step: z.string(),
    description: z.string(),
    what_it_rules_out: z.string().optional(),
  })).optional(),
  likely_causes: z.array(linkItem).optional(),
  repair_options: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    link: z.string().optional(),
    cost: z.string().optional(),
  })).optional(),
  components_involved: z.array(linkItem).optional(),
  tools_required: z.array(z.object({ name: z.string(), reason: z.string().optional() })).optional(),
  technician_insights: z.array(z.string()).optional(),
  when_to_call_pro: whenToCallPro.optional(),
  related_guides: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  faq: z.array(faqItem).optional(),
}).passthrough();

// --- Symptom Condition ---

export const symptomConditionSchema = z.object({
  fast_answer: z.string().optional(),
  most_common_fix: z.object({
    name: z.string(),
    description: z.string().optional(),
    cost: z.string().optional(),
    difficulty: z.string().optional(),
    difficultyColor: z.string().optional(),
    diy: z.boolean().optional(),
  }).optional(),
  diagnostic_checklist: z.array(z.string()).optional(),
  diagnostic_tree_mermaid: z.string().optional(),
  guided_diagnosis_filters: z.record(z.string(), z.any()).optional(),
  likely_causes: z.array(linkItem).optional(),
  repair_options: z.array(z.any()).optional(),
  cost_estimates: z.array(costEstimate).optional(),
  technician_insights: z.array(z.string()).optional(),
  common_mistakes: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    time: z.string().optional(),
  })).optional(),
  faq: z.array(faqItem).optional(),
}).passthrough();

// --- Cause ---

export const causeSchema = z.object({
  fast_answer: z.string().optional(),
  what_this_means: z.string().optional(),
  system_impact: z.string().optional(),
  signs_of_this_cause: z.array(z.string()).optional(),
  diagnostic_checklist: z.array(z.string()).optional(),
  diagnostic_tree_mermaid: z.string().optional(),
  affected_symptoms: z.array(linkItem).optional(),
  repairs: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    link: z.string().optional(),
    cost: z.string().optional(),
    difficulty: z.string().optional(),
    affiliate_link: z.string().optional(),
  })).optional(),
  components: z.array(linkItem).optional(),
  tools_required: z.array(z.object({ name: z.string(), reason: z.string().optional() })).optional(),
  cost_estimates: z.array(costEstimate).optional(),
  technician_insights: z.array(z.string()).optional(),
  common_mistakes: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    time: z.string().optional(),
  })).optional(),
  prevention_tips: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
  when_to_call_pro: whenToCallPro.optional(),
  cost_of_delay: z.string().optional(),
  faq: z.array(faqItem).optional(),
}).passthrough();

// --- Repair ---

export const repairSchema = z.object({
  fast_answer: z.string().optional(),
  repair_overview: z.string().optional(),
  when_this_repair_is_needed: z.string().optional(),
  signs_this_repair_matches: z.array(z.string()).optional(),
  diagnostic_checklist: z.array(z.string()).optional(),
  diagnostic_tree_mermaid: z.string().optional(),
  tools_required: z.array(z.object({ name: z.string(), reason: z.string().optional() })).optional(),
  parts_required: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    affiliate_link: z.string().optional(),
  })).optional(),
  cost_estimates: z.array(costEstimate).optional(),
  technician_insights: z.array(z.string()).optional(),
  common_mistakes: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    time: z.string().optional(),
  })).optional(),
  when_to_call_pro: whenToCallPro.optional(),
  faq: z.array(faqItem).optional(),
}).passthrough();

// --- Component ---

export const componentSchema = z.object({
  fast_answer: z.string().optional(),
  component_overview: z.string().optional(),
  what_this_component_does: z.string().optional(),
  where_it_is_located: z.string().optional(),
  common_failure_symptoms: z.array(linkItem).optional(),
  diagnostic_checklist: z.array(z.string()).optional(),
  diagnostic_tree_mermaid: z.string().optional(),
  testing_methods: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
  replacement_overview: z.array(z.object({ step: z.string(), description: z.string().optional() })).optional(),
  related_causes: z.array(linkItem).optional(),
  tools_required: z.array(z.object({ name: z.string(), reason: z.string().optional() })).optional(),
  cost_estimates: z.array(costEstimate).optional(),
  typical_lifespan: z.string().optional(),
  technician_insights: z.array(z.string()).optional(),
  common_mistakes: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    time: z.string().optional(),
  })).optional(),
  prevention_tips: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
  when_to_call_pro: whenToCallPro.optional(),
  cost_of_delay: z.string().optional(),
  faq: z.array(faqItem).optional(),
}).passthrough();

// --- System ---

export const systemSchema = z.object({
  fast_answer: z.string().optional(),
  system_overview: z.string().optional(),
  how_it_works: z.string().optional(),
  system_diagram_mermaid: z.string().optional(),
  major_components: z.array(linkItem).optional(),
  common_symptoms: z.array(linkItem).optional(),
  diagnostic_workflow: z.array(z.object({ step: z.string(), description: z.string().optional() })).optional(),
  maintenance_priorities: z.array(z.string()).optional(),
  cost_ranges: z.record(z.string(), z.any()).optional(),
  faq: z.array(faqItem).optional(),
}).passthrough();

// --- Location Hub ---

export const locationHubSchema = z.object({
  fast_answer: z.string().optional(),
  local_service_overview: z.string().optional(),
  common_local_problems: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
  })).optional(),
  climate_factors: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
  })).optional(),
  popular_repairs: z.array(linkItem).optional(),
  diagnostic_links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  faq: z.array(faqItem).optional(),
}).passthrough();

// --- Diagnostic (same as symptom) ---

export const diagnosticSchema = symptomSchema;

// --- Registry ---

const SCHEMAS: Record<PageType, z.ZodTypeAny> = {
  symptom: symptomSchema,
  symptom_condition: symptomConditionSchema,
  cause: causeSchema,
  repair: repairSchema,
  component: componentSchema,
  system: systemSchema,
  location_hub: locationHubSchema,
  diagnostic: diagnosticSchema,
};

export function getSchemaForPageType(pageType: PageType): z.ZodTypeAny {
  return SCHEMAS[pageType] ?? symptomSchema;
}

export function validatePageContent(pageType: PageType, content: unknown): { success: true; data: unknown } | { success: false; errors: z.ZodError } {
  const schema = getSchemaForPageType(pageType);
  const result = schema.safeParse(content);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
