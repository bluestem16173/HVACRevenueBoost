import { z } from "zod";

/**
 * Validated output for {@link HSD_CITY_DIAGNOSTIC_SCHEMA_VERSION} prompts
 * (`lib/prompt-schema-router.ts`).
 */
export const HsdCityDiagnosticPageSchema = z.object({
  title: z.string().min(1),
  meta_title: z.string().min(1),
  meta_description: z.string().min(1),
  slug: z.string().min(1),
  vertical: z.string().min(1),
  problem: z.string().min(1),
  city: z.string().min(1),
  summary_30s: z.string().min(1),
  quick_checks: z.array(z.string()).min(4).max(8),
  likely_causes: z.array(z.string()).min(4).max(8),
  diagnostic_steps: z.array(z.string()).min(6).max(12),
  repair_vs_pro: z.object({
    diy_ok: z.array(z.string()).min(3).max(6),
    call_pro: z.array(z.string()).min(3).max(6),
  }),
  cta: z.object({
    primary: z.string().min(1),
    secondary: z.string().min(1),
  }),
  internal_links: z.object({
    parent: z.string().min(1),
    siblings: z.array(z.string()).length(3),
    service: z.string().min(1),
    authority: z.string().min(1),
  }),
});

export type HsdCityDiagnosticPage = z.infer<typeof HsdCityDiagnosticPageSchema>;
