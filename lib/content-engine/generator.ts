import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import {
  MASTER_UNIFIED_PROMPT,
  EXPECTED_PROMPT_HASH,
  ENGINE_VERSION,
  validateContent
} from "./core";

import {
  getFallback
} from "./schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function safeJsonParse<T>(str: string): T | null {
  try { return JSON.parse(str) as T; } catch { return null; }
}

function isJsonTruncated(str: string): boolean {
  return !str.trim().endsWith("}");
}

// --- RETRY ---
async function callWithRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number, pageType?: string } = {}
): Promise<T> {
  const { maxRetries = 3, pageType = "symptom" } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        const delay = 1000 * (attempt + 1);
        console.warn(`Retry ${attempt + 1}/${maxRetries} in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.error("FAILED_AFTER_3_ATTEMPTS", lastError);
  const hash = EXPECTED_PROMPT_HASH;
  return { ...getFallback(pageType), _prompt_hash: hash } as any as T;
}

function finalizeOutput(raw: string, pageType: string) {
  const fallback = getFallback(pageType);
  try {
    const cleaned = raw.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    const source = parsed?.payload ?? parsed;

    const result = validateContent(source, pageType);

    if (!result.success) {
      console.error("ZOD ERROR:", result.error.flatten());
      return fallback;
    }

    return result.data;
  } catch (err) {
    console.error("PARSE ERROR:", err);
    return fallback;
  }
}

export async function generateTwoStagePage(
  problem: string,
  options: {
    slug?: string;
    system?: string;
    coreOnly?: boolean;
    pageType?: string;
    keyword?: string;
    scenario?: string;
  } = {}
) {
  const { slug = "", system = "HVAC", pageType = "symptom", keyword = "", scenario = "" } = options;

  return callWithRetry(async () => {
    // --- STAGE 1: Fast/Cheap Structural Layout ---
    const userMsg1 = `Generate HVAC structural overview and SEO blueprint for:
ISSUE: "${problem}"
PROPERTY_TYPE: "commercial or residential depending on context"

Additional Context:
- SLUG: ${slug}
- SYSTEM: ${system}
- PAGE_TYPE: ${pageType}

Generate JSON matching this exact schema:
{
  "slug": "string",
  "page_type": "string",
  "title": "string",
  "relationships": { "system": [], "symptoms": [], "diagnostics": [], "causes": [], "components": [], "context": [], "repairs": [] },
  "content": {
    "hero": { "headline": "...", "subheadline": "..." },
    "symptoms": ["..."],
    "whyItHappens": ["..."],
    "quickChecks": ["..."],
    "faq": [{ "question": "...", "answer": "..." }]
  }
}`;

    const stage1Response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are the HVAC fast-routing AI. Output strict JSON." },
        { role: "user", content: userMsg1 },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    });

    const raw1 = stage1Response.choices[0]?.message?.content;
    if (!raw1) throw new Error("Stage 1: empty response");
    if (isJsonTruncated(raw1)) throw new Error("Stage 1: output truncated");

    const parsedStage1 = safeJsonParse<any>(raw1.replace(/^\^\s*```json/i, "").replace(/```\s*$/i, "").trim());
    if (!parsedStage1) throw new Error("Stage 1: Invalid JSON");

    let finalObj = parsedStage1;

    if (pageType === "diagnostic") {
      // --- STAGE 2: Premium Reasoning & Logic Graphs ---
      const userMsg2 = `Act as a Senior HVAC Diagnostics Engineer. Build the deep mechanical reasoning and diagnostic logic for the symptom: "${problem}" (Title: "${parsedStage1.title || problem}").

Generate JSON matching this exact schema:
{
  "content": {
    "systemMechanics": { "downstreamEffects": [], "corePrinciple": "...", "whatBreaks": "..." },
    "graphBlock": { "description": "...", "nodes": [] },
    "safetyRisks": ["..."],
    "decisionFramework": { "recommendation": "..." },
    "technicalDeepDive": { "heatTransferOverview": "..." },
    "repairReasoning": ["..."],
    "diagnosticFlow": [{ "step": "...", "question": "...", "yes": "...", "no": "..." }],
    "commonCauses": ["..."],
    "solutions": ["..."]
  }
}`;

      const stage2Response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert HVAC Diagnostic AI. Output strict JSON." },
          { role: "user", content: userMsg2 },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 3500,
      });

      const raw2 = stage2Response.choices[0]?.message?.content;
      if (!raw2) throw new Error("Stage 2: empty response");
      if (isJsonTruncated(raw2)) throw new Error("Stage 2: output truncated");

      const parsedStage2 = safeJsonParse<any>(raw2.replace(/^\^\s*```json/i, "").replace(/```\s*$/i, "").trim());
      if (!parsedStage2) throw new Error("Stage 2: Invalid JSON");

      // --- MERGE ---
      finalObj = {
        ...parsedStage1,
        content: {
          ...(parsedStage1.content || {}),
          ...(parsedStage2.content || {})
        }
      };
    }

    const content = finalizeOutput(JSON.stringify(finalObj), pageType);

    // Assign locks so the worker can enforce them
    const hash = EXPECTED_PROMPT_HASH;
    (content as any)._prompt_hash = hash;
    (content as any).engineVersion = ENGINE_VERSION;

    try {
      const { getAllPages, generateInternalLinks } = await import('./links');
      const allPages = await getAllPages();
      const internalLinks = generateInternalLinks(slug, allPages);
      (content as any).internalLinks = internalLinks;
    } catch (e) {
      console.error("Failed to append internal links:", e);
    }

    return content;
  }, { pageType });
}
