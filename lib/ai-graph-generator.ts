/**
 * DecisionGrid-Aligned Graph Node Generator
 * AI generates structured graph nodes only — no full HTML pages.
 * Templates render pages from graph data.
 *
 * Output: symptoms, conditions, diagnostics, causes, repairs, components
 */

import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GRAPH_NODE_PROMPT = `You are an HVAC diagnostic knowledge graph builder. Return ONLY structured JSON for graph nodes. No HTML, no prose.

For a SYMPTOM node, return:
{
  "symptom": { "name": "...", "slug": "...", "description": "2-3 sentences" },
  "causes": [ { "name": "...", "slug": "...", "explanation": "1-2 sentences" } ],
  "repairs": [ { "name": "...", "slug": "...", "estimated_cost": "$X-$Y", "difficulty": "Easy|Medium|Hard" } ],
  "components": [ { "name": "...", "slug": "..." } ]
}

For a CAUSE node, return:
{
  "cause": { "name": "...", "slug": "...", "description": "2-3 sentences" },
  "repairs": [ { "name": "...", "slug": "...", "estimated_cost": "...", "difficulty": "..." } ],
  "components": [ { "name": "...", "slug": "..." } ]
}

For a REPAIR node, return:
{
  "repair": { "name": "...", "slug": "...", "description": "...", "estimated_cost": "...", "skill_level": "..." },
  "components": [ { "name": "...", "slug": "..." } ]
}

Slugs must be lowercase, hyphenated (e.g. low-refrigerant, replace-capacitor).
Minimum 3 causes per symptom. Minimum 2 repairs per cause.`;

export type GraphNodeType = "symptom" | "cause" | "repair";

export interface SymptomNode {
  symptom: { name: string; slug: string; description: string };
  causes: { name: string; slug: string; explanation: string }[];
  repairs: { name: string; slug: string; estimated_cost: string; difficulty: string }[];
  components: { name: string; slug: string }[];
}

export interface CauseNode {
  cause: { name: string; slug: string; description: string };
  repairs: { name: string; slug: string; estimated_cost: string; difficulty: string }[];
  components: { name: string; slug: string }[];
}

export interface RepairNode {
  repair: { name: string; slug: string; description: string; estimated_cost: string; skill_level: string };
  components: { name: string; slug: string }[];
}

export type GraphNodeOutput = SymptomNode | CauseNode | RepairNode;

export async function generateGraphNode(
  nodeType: GraphNodeType,
  slug: string,
  title: string,
  context?: Record<string, unknown>
): Promise<GraphNodeOutput> {
  const systemPrompt = `${GRAPH_NODE_PROMPT}

Generate a ${nodeType.toUpperCase()} node.
- Slug: ${slug}
- Title: ${title}
${context ? `Context: ${JSON.stringify(context)}` : ""}

Return valid JSON only.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 1200,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");

  return JSON.parse(content) as GraphNodeOutput;
}
