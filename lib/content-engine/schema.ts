import { z } from 'zod';

// Phase 44: Deep Diagnostic Schema Migration (11-Block Format)

export const DiagnosticFlowStepSchema = z.object({
  step: z.string().min(1).optional(),
  question: z.string().min(1).optional(),
  yes: z.string().min(1).optional(),
  no: z.string().min(1).optional(),
});

export const TopCauseSchema = z.object({
  cause: z.string().min(1),
  likelihood: z.enum(["High", "Medium", "Low"]).optional(),
  why_it_happens: z.string().min(1).optional(),
  symptoms: z.array(z.string().min(1)).optional(),
  fix_summary: z.string().min(1).optional(),
});

export const RepairMatrixRowSchema = z.object({
  issue: z.string().min(1),
  solution: z.string().min(1),
  difficulty: z.enum(["Easy", "Moderate", "Hard"]).optional(),
  tools_needed: z.array(z.string().min(1)).optional(),
  estimated_cost: z.string().min(1).optional(),
});

export const ContentSchema = z
  .object({
    slug: z.string().optional(),
    title: z.string().optional(),
    page_type: z.string().optional(),
    system: z.string().optional(),
    category: z.string().optional(),

    decision_tree: z.any().optional(),
    system_explanation: z.array(z.string().min(1)).optional(),
    tech_observation: z.string().min(1).optional(),

    diagnostic_flow: z.array(DiagnosticFlowStepSchema).optional(),
    top_causes: z.array(TopCauseSchema).optional(),
    repair_matrix: z.any().optional(),
    quick_tools: z.array(z.string().min(1)).optional(),

    hero: z.any().optional(),
    intro: z.string().optional(),
    summary: z.string().optional(),
    body: z.any().optional(),
    faq: z.any().optional(),
    cta: z.any().optional(),
    related_links: z.any().optional(),
    seo: z.any().optional(),
    
    // Legacy mapping support for 11-block UI
    quickAnswer: z.array(z.string()).optional(),
    causes: z.array(z.any()).optional(),
    fixes: z.array(z.any()).optional(),
  })
  .passthrough();

export const StageOneSchema = z
  .object({
    slug: z.string(),
    page_type: z.enum(['symptom', 'diagnostic', 'cause', 'repair', 'context', 'component', 'system', 'hybrid', 'authority']).catch('diagnostic' as any),
    title: z.string(),
    relationships: z.any().optional(),
    content: ContentSchema.optional()
  })
  .passthrough();

export const StageTwoSchema = z.object({
  content: z.object({
    // 6. COST BREAKDOWN
    costBreakdown: z.object({
      repairCostRanges: z.string().optional(),
      diyVsProfessional: z.string().optional(),
      whatAffectsPrice: z.string().optional(),
      whenCostSpikes: z.string().optional()
    }).passthrough().optional(),

    // 7. PREVENTION
    prevention: z.object({
      howToAvoidLongTerm: z.string().optional(),
      maintenanceHabits: z.array(z.string()).optional(),
      systemUpgrades: z.string().optional()
    }).passthrough().optional(),

    // 8. WARNING SIGNS
    warningSigns: z.object({
      symptomsBeforeFailure: z.array(z.string()).optional(),
      whatUsersMiss: z.string().optional(),
      escalationPatterns: z.string().optional()
    }).passthrough().optional(),

    // 9. CTA
    cta: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      urgency: z.string().optional()
    }).passthrough().optional(),

    // 10. INTERNAL LINKS
    internalLinks: z.array(z.string()).optional(),

    // 11. FAQ
    faq: z.array(z.object({
      question: z.string().optional(),
      answer: z.string().optional()
    }).passthrough()).optional()
  }).passthrough().optional()
}).passthrough();

export const UnifiedGeneratedContentSchema = z.intersection(StageOneSchema, StageTwoSchema);

export const Schema = UnifiedGeneratedContentSchema;
export type GeneratedContent = z.infer<typeof UnifiedGeneratedContentSchema>;
export type StageOneContent = z.infer<typeof StageOneSchema>;
export type StageTwoContent = z.infer<typeof StageTwoSchema>;

// Fallback logic explicitly mapped against the new 11-Block structure to prevent UI hydration crashes
export function getFallback(pageType: string): GeneratedContent {
  return {
    slug: 'fallback',
    page_type: (pageType as any) || 'diagnostic',
    title: 'Diagnostic Fallback',
    relationships: { system: [], symptoms: [], diagnostics: [], causes: [], repairs: [] },
    content: {
      hero: {
        problemStatement: "We encountered an issue determining the exact diagnostic path.",
        immediateInstruction: "Review the general parameters below or call a technician.",
        expectationSetting: "This generic diagnostic guide will help narrow down the failure."
      },
      quickAnswer: [
        "Check your thermostat settings",
        "Verify your breaker hasn't tripped",
        "Inspect the air filter"
      ],
      diagnosticFlow: [],
      causes: [],
      fixes: [],
      faq: []
    }
  };
}

export function getSchema(pageType: string) {
  return UnifiedGeneratedContentSchema;
}
