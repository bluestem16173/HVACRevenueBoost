import { z } from "zod";

export const DgAuthorityV2Schema = z.object({
  layout: z.literal("dg_authority_v2"),
  page_type: z.string(),
  slug: z.string(),
  title: z.string(),
  h1: z.string(),
  meta_title: z.string(),
  meta_description: z.string(),
  canonical_path: z.string(),
  intro: z.string(),
  summary_30s: z.object({
    label: z.string().optional(),
    bullets: z.array(z.string()),
  }),
  safety_alert: z.object({
    severity: z.enum(["low", "medium", "high", "critical"]),
    title: z.string(),
    body: z.string(),
    triggers: z.array(z.string()),
  }).optional(),
  quick_checks: z.array(z.object({
    step: z.string(),
    why_it_matters: z.string(),
  })),
  sidebar_cta: z.object({
    title: z.string(),
    body: z.string(),
    primary_cta: z.string(),
    secondary_cta: z.string().optional(),
  }),
  most_common_causes: z.array(z.object({
    cause: z.string(),
    probability_note: z.string(),
    explanation: z.string(),
    signs: z.array(z.string()),
  })),
  how_the_system_works: z.object({
    overview: z.string(),
    components: z.array(z.object({
      name: z.string(),
      role: z.string(),
    })),
  }),
  diagnostic_flow: z.array(z.object({
    step_number: z.number(),
    test: z.string(),
    pass_condition: z.string(),
    fail_implication: z.string(),
    next_step: z.string(),
  })),
  repair_matrix: z.array(z.object({
    symptom: z.string(),
    likely_issue: z.string(),
    fix_type: z.string(),
    difficulty: z.enum(["Easy", "Moderate", "Hard", "Expert", "Pro Only"]),
    estimated_cost: z.string(),
  })),
  repair_vs_replace: z.object({
    repair_when: z.string(),
    replace_when: z.string(),
    decision_note: z.string(),
  }),
  tools_needed: z.array(z.object({
    tool: z.string(),
    purpose: z.string(),
  })),
  stop_diy: z.object({
    title: z.string(),
    reasons: z.array(z.string()),
  }),
  prevention_tips: z.array(z.string()),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  internal_links: z.object({
    related_symptoms: z.array(z.object({
      label: z.string(),
      slug: z.string(),
    })),
    related_system_pages: z.array(z.object({
      label: z.string(),
      slug: z.string(),
    })),
    pillar_page: z.object({
      label: z.string(),
      slug: z.string(),
    }).optional(),
  }),
  local_service_cta: z.object({
    title: z.string(),
    body: z.string(),
    button_text: z.string(),
  }),
  author_note: z.string().optional(),
  schema_version: z.string()
});

export type DgAuthorityV2Data = z.infer<typeof DgAuthorityV2Schema>;
