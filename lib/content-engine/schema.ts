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

export function isValidContent(data: unknown): data is GeneratedContent {
  const result = Schema.safeParse(data);
  return result.success;
}
