import { z } from "zod";

export const diagnosticEngineJsonSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  intro: z.string(),
  systemExplanation: z.array(z.string()).min(3, "At least 3 system explanations required"),
  decision_tree: z.string().refine(val => val.includes('flowchart') || val.includes('graph'), {
    message: "decision_tree must be a valid Mermaid flowchart or graph"
  }),
  dynamicAnswer: z.object({
    likelyCause: z.string(),
    confidence: z.string(),
    reason: z.string()
  }),
  diagnosticFlow: z.array(z.object({
    step: z.number(),
    question: z.string(),
    yes: z.string(),
    no: z.string(),
    next_step: z.number().nullable()
  })).min(3, "At least 3 diagnostic steps required"),
  commonCauses: z.array(z.any()), // Can be flat or categorized, keeping it flexible per spec "flat or categorized per Zod"
  toolsNeeded: z.array(z.any()),
  fixes: z.array(z.any()),
  preventionTips: z.array(z.string()),
  seo: z.object({
    title: z.string(),
    meta_description: z.string().max(155, "Meta description exceeds 155 chars"),
    h1: z.string(),
    keywords: z.array(z.string())
  }),
  cta: z.object({
    primary: z.string(),
    secondary: z.string(),
    urgency: z.string(),
    placement_hint: z.string().optional()
  }),
  internal_links: z.object({
    related_symptoms: z.array(z.any()),
    related_causes: z.array(z.any()),
    repair_guides: z.array(z.any())
  }),
  // Optional fields
  diagnosticIntro: z.string().optional(),
  confidence_score: z.number().min(0).max(100).optional(),
  imageMap: z.any().optional() // Omitted unless schema supports it
});

export type DiagnosticEngineJson = z.infer<typeof diagnosticEngineJsonSchema>;
