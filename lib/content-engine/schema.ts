import { z } from 'zod';

export const StageOneSchema = z.object({
  slug: z.string(),
  page_type: z.enum(['symptom', 'diagnostic', 'cause', 'repair', 'context', 'component', 'system']).catch('diagnostic' as any),
  title: z.string(),
  relationships: z.object({
    system: z.array(z.string()).optional(),
    symptoms: z.array(z.string()).optional(),
    diagnostics: z.array(z.string()).optional(),
    causes: z.array(z.string()).optional(),
    components: z.array(z.string()).optional(),
    context: z.array(z.string()).optional(),
    repairs: z.array(z.string()).optional()
  }).passthrough(),
  content: z.object({
    hero: z.object({
      headline: z.string().optional(),
      subheadline: z.string().optional()
    }).passthrough().optional(),
    symptoms: z.array(z.any()).optional(),
    whyItHappens: z.array(z.any()).optional(),
    quickChecks: z.array(z.any()).optional(),
    faq: z.array(z.any()).optional(),
    internalLinks: z.any().optional()
  }).passthrough().optional()
}).passthrough();

export const StageTwoSchema = z.object({
  content: z.object({
    systemMechanics: z.any().optional(),
    graphBlock: z.any().optional(),
    safetyRisks: z.any().optional(),
    decisionFramework: z.any().optional(),
    technicalDeepDive: z.any().optional(),
    repairReasoning: z.any().optional(),
    diagnosticFlow: z.array(z.any()).optional(),
    commonCauses: z.array(z.string()).optional(),
    solutions: z.array(z.string()).optional()
  }).passthrough().optional()
}).passthrough();

export const UnifiedGeneratedContentSchema = z.intersection(StageOneSchema, StageTwoSchema);

export const Schema = UnifiedGeneratedContentSchema;
export type GeneratedContent = z.infer<typeof UnifiedGeneratedContentSchema>;
export type StageOneContent = z.infer<typeof StageOneSchema>;
export type StageTwoContent = z.infer<typeof StageTwoSchema>;

export interface CauseContent {
  hero: any;
  whatIsIt: any;
  systemMechanics: { 
    downstreamEffects: any[]; 
    corePrinciple: string;
    whatBreaks: string;
  };
  technicalDeepDive: {
    heatTransferOverview: string;
    thermodynamics: { principles: any[]; phaseChangeExplanation: string; pressureTemperatureRelationship: string; };
    quantitativeIndicators: any;
    systemComponents: any;
    failureDynamics: { cascadeEffects: any[]; efficiencyLossMechanism: string; whatChanges: string; };
    graphModels: any[];
    realWorldInterpretation: string;
  };
  symptoms: any[];
  whyItHappens: any[];
  businessImpacts: any[];
  quickChecks: any[];
  components: any[];
  internalLinks: { diagnose: any[]; conditions: any[]; repairs: any[]; };
  graphBlock: any;
  related_tools: any[];
  repairs: any[];
  [key: string]: any;
}

export function getFallback(pageType: string): GeneratedContent {
  return {
    slug: 'fallback',
    page_type: (pageType as any) || 'diagnostic',
    title: 'Diagnostic Fallback',
    relationships: { system: [], symptoms: [], diagnostics: [], causes: [], components: [], context: [], repairs: [] },
    content: {
      hero: {
        headline: "Troubleshoot the issue step by step",
        subheadline: "Use this structured guide"
      },
      diagnosticFlow: [],
      commonCauses: [],
      quickChecks: [],
      solutions: []
    }
  };
}

export function getSchema(pageType: string) {
  return UnifiedGeneratedContentSchema;
}
