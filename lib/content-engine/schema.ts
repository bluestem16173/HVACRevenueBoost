import { z } from 'zod';

const HeroSchema = z.object({
  headline: z.string().min(10).max(120),
  subheadline: z.string().min(10).max(320),
  description: z.string().min(10).max(500),
}).passthrough();

const DiagnosticFlowSchema = z.array(z.object({
  step: z.number().optional(),
  title: z.string().optional(),
  actions: z.array(z.string()).optional(),
  yes: z.string().optional(),
  no: z.string().optional(),
  interpretation: z.string().optional(),
  field_insight: z.string().optional(),
  related_causes: z.array(z.string()).optional(),
}).passthrough());
const CommonCauseSchema = z.any();
const QuickCheckSchema = z.any();
const SolutionSchema = z.any();

const CtaSchema = z.object({
  primaryText: z.string().optional(),
  secondaryText: z.string().optional(),
  urgencyText: z.string().optional(),
}).passthrough();

const FAQItemSchema = z.object({
  question: z.string().min(10).max(180),
  answer: z.string().min(15).max(400),
}).passthrough();

export const UnifiedGeneratedContentSchema = z
  .object({
    hero: HeroSchema,
    mermaidGraph: z.string().optional(),
    diagnosticFlow: DiagnosticFlowSchema,
    commonCauses: z.array(CommonCauseSchema).min(2).max(6),
    quickChecks: z.array(QuickCheckSchema).min(2).max(6),
    solutions: z.array(SolutionSchema).min(2).max(6),
    cta: CtaSchema,
    faq: z.array(FAQItemSchema).min(3).max(8),
  })
  .strict();

export const Schema = UnifiedGeneratedContentSchema;
export type GeneratedContent = z.infer<typeof UnifiedGeneratedContentSchema>;

export const fallbackUnifiedContent: GeneratedContent = {
  hero: {
    headline: 'Troubleshoot the issue step by step',
    subheadline: 'Use this structured guide to narrow down the most likely cause.',
    description: 'This page provides a practical starting point for identifying common causes.'
  },
  mermaidGraph: "graph TD\n  A[Start] --> B(Check)\n  B --> C{Good?}\n  C -->|Yes| D[Done]\n  C -->|No| E[Fix]",
  diagnosticFlow: [
    {
      step: 1,
      title: 'Does it happen consistently?',
      actions: ['Observe the issue'],
      yes: 'Proceed to next',
      no: 'Check intermittent causes',
      interpretation: 'Identifies consistency.',
      field_insight: 'Always check if it is consistent.',
      related_causes: []
    },
    {
      step: 2,
      title: 'Have you checked the obvious settings?',
      actions: ['Review inputs'],
      yes: 'System is set correctly',
      no: 'Fix settings',
      interpretation: 'Rules out user error.',
      field_insight: 'Most service calls are settings.',
      related_causes: []
    }
  ],
  commonCauses: [
    { cause: 'Incorrect setup or control state' },
    { cause: 'Component wear or blockage' },
  ],
  quickChecks: [
    { instruction: 'Verify obvious inputs' },
    { instruction: 'Inspect for visible warning signs' },
  ],
  solutions: [
    { steps: ['Shut the system down safely', 'Restart and observe the result'] },
    { steps: ['Turn power off if applicable', 'Remove visible debris and retest'] },
  ],
  cta: {
    primaryText: 'Start guided diagnosis',
    secondaryText: 'Get help',
    urgencyText: 'Check next step',
  },
  faq: [
    {
      question: 'What should I check first?',
      answer: 'Start with simple visible conditions and obvious inputs.'
    },
    {
      question: 'When should I stop troubleshooting?',
      answer: 'Stop if you see a safety issue such as burning smell or overheating.'
    },
    {
      question: 'When is professional help the better option?',
      answer: 'Professional help is better when quick checks fail or involve sealed parts.'
    },
  ],
};

export const fallbackJson = fallbackUnifiedContent;
UnifiedGeneratedContentSchema.parse(fallbackUnifiedContent);

export const CauseSchema = z.object({
  slug: z.string().optional(),
  hero: z.object({
    headline: z.string(),
    subheadline: z.string(),
    intro: z.string()
  }).passthrough(),
  whatIsIt: z.object({
    explanation: z.string(),
    whyItMatters: z.string()
  }).passthrough(),
  systemMechanics: z.object({
    corePrinciple: z.string(),
    whatBreaks: z.string(),
    downstreamEffects: z.array(z.string())
  }).passthrough(),
  graphBlock: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    xLabel: z.string(),
    yLabel: z.string(),
    series: z.array(z.object({
      label: z.string(),
      points: z.array(z.object({
        x: z.number(),
        y: z.number()
      }))
    })),
    takeaway: z.string().optional()
  }).passthrough().optional(),
  technicalDeepDive: z.object({
    heatTransferOverview: z.string(),
    thermodynamics: z.object({
      principles: z.array(z.string()),
      phaseChangeExplanation: z.string(),
      pressureTemperatureRelationship: z.string()
    }).passthrough(),
    systemComponents: z.object({
      evaporator: z.string(),
      condenser: z.string(),
      compressor: z.string(),
      expansionDevice: z.string()
    }).passthrough(),
    failureDynamics: z.object({
      whatChanges: z.string(),
      efficiencyLossMechanism: z.string(),
      cascadeEffects: z.array(z.string())
    }).passthrough(),
    quantitativeIndicators: z.object({
      temperatureSplit: z.string(),
      pressureRanges: z.string(),
      airflowCFMImpact: z.string()
    }).passthrough(),
    graphModels: z.array(z.object({
      type: z.string(),
      description: z.string(),
      equation: z.string()
    })).optional(),
    realWorldInterpretation: z.string()
  }).passthrough().optional(),
  symptoms: z.array(z.string()),
  whyItHappens: z.array(z.string()),
  systemImpact: z.array(z.string()),
  howToConfirm: z.array(z.string()),
  quickChecks: z.array(z.string()),
  solutions: z.array(z.string()),
  safetyRisks: z.object({
    mechanical: z.array(z.string()),
    chemical: z.array(z.string()),
    electrical: z.array(z.string()),
    regulatory: z.array(z.string())
  }).passthrough(),
  decisionFramework: z.object({
    diy: z.object({ cost: z.string(), time: z.string(), risk: z.string() }).passthrough(),
    professional: z.object({ cost: z.string(), time: z.string(), riskReduction: z.string() }).passthrough(),
    recommendation: z.string()
  }).passthrough(),
  costImpact: z.object({
    severity: z.string(),
    estimatedCost: z.string()
  }).passthrough(),
  whenToAct: z.string(),
  internalLinks: z.object({
    diagnose: z.array(z.string()),
    relatedCauses: z.array(z.string()),
    repairs: z.array(z.string())
  }).passthrough(),
  cta: z.object({
    primary: z.string(),
    secondary: z.string()
  }).passthrough(),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })).optional()
}).passthrough();

export type CauseContent = z.infer<typeof CauseSchema>;

export const fallbackCauseContent: CauseContent = {
  slug: "unknown-cause",
  hero: { headline: "Troubleshoot the Cause", subheadline: "Understand why this component failed.", intro: "This guide breaks down exactly what happened, how to confirm it, and what your next step should be." },
  whatIsIt: { explanation: "Fallback cause explanation.", whyItMatters: "Important to understand the root cause before replacing parts." },
  systemMechanics: { corePrinciple: "Heat transfer and airflow.", whatBreaks: "Component failure over time.", downstreamEffects: ["Reduced efficiency", "Compressor damage"] },
  graphBlock: {
    title: "Performance Drops Over Time",
    subtitle: "System strain vs efficiency",
    xLabel: "Time Delayed (Weeks)",
    yLabel: "System Strain (%)",
    series: [{ label: "Strain", points: [{x:0, y:10}, {x:1, y:20}, {x:2, y:45}, {x:3, y:80}] }],
    takeaway: "Waiting increases the likelihood of catastrophic failure."
  },
  technicalDeepDive: {
    heatTransferOverview: "Heat transfer stalls due to pressure loss.",
    thermodynamics: { principles: ["Convection", "Phase Change"], phaseChangeExplanation: "Liquid fails to boil efficiently.", pressureTemperatureRelationship: "Lower pressure = lower boiling point." },
    systemComponents: { evaporator: "Absorbs less heat.", condenser: "Rejects less heat.", compressor: "Overheats.", expansionDevice: "Starves." },
    failureDynamics: { whatChanges: "Pressure drops.", efficiencyLossMechanism: "Compressor runs longer.", cascadeEffects: ["Ice formation"] },
    quantitativeIndicators: { temperatureSplit: "Drops below 15°F", pressureRanges: "Sub-optimal suction", airflowCFMImpact: "Restricted over frozen coil" },
    graphModels: [{ type: "function", description: "Heat Transfer Profile", equation: "Q = U x A x ΔT" }],
    realWorldInterpretation: "The system runs constantly but blows warm air."
  },
  symptoms: ["AC not working"], whyItHappens: ["Component wear"], systemImpact: ["Reduced efficiency"], howToConfirm: ["Visual inspection"], quickChecks: ["Check power"], solutions: ["Call a professional"],
  safetyRisks: { mechanical: ["Moving parts"], chemical: ["Refrigerant"], electrical: ["High voltage"], regulatory: ["EPA Certification Required"] },
  decisionFramework: {
    diy: { cost: "$0 - $50", time: "1 hour", risk: "High" },
    professional: { cost: "$150 - $400", time: "2 hours", riskReduction: "Guaranteed correct diagnosis and safe repair." },
    recommendation: "Professional diagnostic recommended due to electrical and chemical hazards."
  },
  costImpact: { severity: "moderate", estimatedCost: "Varies" },
  whenToAct: "As soon as you notice the symptom",
  internalLinks: { diagnose: [], relatedCauses: [], repairs: [] },
  cta: { primary: "Get Your System Checked", secondary: "Book a Diagnostic" },
  faq: []
};
CauseSchema.parse(fallbackCauseContent);

export function getSchema(pageType: string) {
  return pageType === 'cause' ? CauseSchema : UnifiedGeneratedContentSchema;
}

export function getFallback(pageType: string) {
  return pageType === 'cause' ? fallbackCauseContent : fallbackUnifiedContent;
}

export function isValidContent(data: unknown, pageType: string = "symptom"): boolean {
  const result = getSchema(pageType).safeParse(data);
  return result.success;
}
