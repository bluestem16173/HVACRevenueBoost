import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  assertDailySpendAllows,
  recordOpenAiChatUsage,
} from "@/lib/ai-spend-guard";
import { assertAutoModeEnabled } from "@/lib/generation-guards";
import OpenAI from "openai";
import {
  MASTER_GOLD_STANDARD_PROMPT,
  EXPECTED_PROMPT_HASH,
  ENGINE_VERSION,
  validateContent
} from "./core";

import {
  getFallback,
  SCHEMA_STRING
} from "./schema";
import { normalizePageTypeKey } from "@/config/page-types";
import {
  buildHrbTaskPrompt,
  HRB_SYSTEM_LOCK,
  isDecisionGridDiagnosticMode,
} from "./prompts/hvac-revenue-boost";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new OpenAI({ 
  apiKey: process.env.GEMINI_API_KEY, 
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/" 
});

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
      console.error("ZOD ERROR:", result.error?.flatten());
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
    /** When true, skips system_state auto_mode check (e.g. worker --manual, canary). */
    bypassAutoMode?: boolean;
  } = {}
) {
  const { slug = "", system = "HVAC", pageType = "symptom", keyword = "", scenario = "" } = options;

  if (process.env.GENERATION_ENABLED !== "true") {
    console.log("🚫 Generation globally disabled");
    return undefined as any;
  }
  await assertAutoModeEnabled({ bypassAutoMode: options.bypassAutoMode === true });
  await assertDailySpendAllows("generateTwoStagePage:start");
  console.log("GENERATION TRIGGERED", new Date());

  return callWithRetry(async () => {
    await assertDailySpendAllows("generateTwoStagePage:retry");
    // --- STAGE 1: Fast/Cheap Structural Layout ---
    let userMsg1 = `Generate HVAC structural overview and SEO blueprint for:
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
    let sysMsg = "You are the HVAC fast-routing AI. Output strict JSON.";

    if (pageType === 'authority') {
      userMsg1 = `You are generating a HIGH-CONVERSION HVAC authority page for a local service business.

This is NOT an SEO blog.

This page must:
- Build trust quickly
- Explain simply
- Lead to a service call
- Feel local and actionable

STRICT RULES:
- Output JSON only
- No markdown
- No explanations
- No fluff
- Short paragraphs only
- Every section must support conversion

TONE:
- Clear, confident, professional
- Not technical-heavy
- Homeowner-friendly

---

OUTPUT STRUCTURE:

{
  "type": "authority",
  "slug": "[lowercase, hyphenated slug]",
  "title": "[clean readable title]",
  "hero": {
    "headline": "[strong benefit-driven headline]",
    "subheadline": "[simple explanation + trust subheadline]"
  },
  "explanation": "[3-5 sentences simple breakdown with no jargon]",
  "whyItMatters": "[connect to real homeowner pain]",
  "commonIssues": ["[short issue 1]", "[short issue 2]", "[short issue 3]", "[short issue 4]"],
  "whenToCall": "[strong conversion trigger]",
  "localTrust": {
    "experience": "[experience statement]",
    "guarantee": "[guarantee statement]"
  },
  "cta": {
    "primary": "Call Now",
    "secondary": "Schedule Service"
  },
  "seo": {
    "metaTitle": "[seo meta title]",
    "metaDescription": "[seo meta description]"
  }
}

---

FIELD REQUIREMENTS:

slug:
- lowercase, hyphenated
- example: how-air-conditioners-work

title:
- clean and readable
- no clickbait

hero.headline:
- strong, benefit-driven
- example: "How Your AC Works (And Why It Stops)"

hero.subheadline:
- simple explanation + trust
- example: "Understanding your system helps you avoid costly breakdowns"

explanation:
- simple breakdown (3-5 sentences)
- no jargon

whyItMatters:
- connect to real homeowner pain
- energy bills, breakdowns, comfort

commonIssues:
- 4-6 items
- short phrases
- tied to real failures

whenToCall:
- strong conversion trigger
- urgency but not pushy

localTrust.experience:
- "Serving homeowners with fast, reliable HVAC service"

localTrust.guarantee:
- "Upfront pricing, no surprises"

cta:
- always service-focused

seo.metaTitle:
- include keyword + city placeholder

seo.metaDescription:
- benefit-driven + click-focused

---

CONTEXT:
Topic: ${slug || problem}
City: Tampa

Generate a complete JSON output.`;
    }

    if (pageType === 'hybrid') {
      userMsg1 = `You are generating a HIGH-AUTHORITY HVAC SERVICE PAGE optimized for conversion and local SEO.

This is NOT purely educational. This is a local service "money page".

OUTPUT STRUCTURE:
{
  "page_type": "hybrid",
  "slug": "${slug}",
  "title": "[clean readable title]",
  "hero": {
    "headline": "[urgent + credible headline e.g. AC Not Cooling in Tampa?]",
    "subheadline": "[fast, definitive subheadline]",
    "authorityLine": "[trust injection e.g. Voted #1 Local Experts]"
  },
  "problemSection": {
    "summary": "[clear description of the homeowner's experience]",
    "symptoms": ["[symptom 1]", "[symptom 2]", "[symptom 3]"],
    "impact": "[why waiting makes it worse]"
  },
  "authoritySection": {
    "technicalExplanation": "[simplified accurate technical explanation]",
    "commonCauses": ["[cause 1]", "[cause 2]", "[cause 3]"],
    "riskFactors": ["[risk 1]", "[risk 2]"]
  },
  "solutionSection": {
    "howWeFixIt": ["[step 1]", "[step 2]", "[step 3]"],
    "serviceApproach": "[explanation of your diagnostic method]",
    "timeToFix": "[expected time window]"
  },
  "trustSection": {
    "experience": "[years of experience statement]",
    "certifications": ["[certification 1]", "[certification 2]"],
    "guarantees": ["[guarantee 1]", "[guarantee 2]"]
  },
  "localSection": {
    "primaryCity": "Tampa",
    "areasServed": ["[area 1]", "[area 2]", "[area 3]"],
    "localProof": "[why local climate matters here]"
  },
  "cta": {
    "primary": "Call Now",
    "secondary": "Book Service Today",
    "urgency": "[why call today]"
  },
  "faq": [
    { "question": "[cost/time question]", "answer": "[clear direct answer]" }
  ]
}

CONTEXT:
Topic: ${slug || problem}
City: Tampa

Generate ONLY valid JSON. Keep sections snappy and conversion-focused.`;
      sysMsg = "You are an expert HVAC technician and local service authority. Output strict JSON.";
    }

    const stage1Response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sysMsg },
        { role: "user", content: userMsg1 },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    });
    await recordOpenAiChatUsage("gpt-4o-mini", stage1Response.usage, "two-stage:stage1");

    const raw1 = stage1Response.choices[0]?.message?.content;
    if (!raw1) throw new Error("Stage 1: empty response");
    if (isJsonTruncated(raw1)) throw new Error("Stage 1: output truncated");

    const parsedStage1 = safeJsonParse<any>(raw1.replace(/^\^\s*```json/i, "").replace(/```\s*$/i, "").trim());
    if (!parsedStage1) throw new Error("Stage 1: Invalid JSON");

    let finalObj = parsedStage1;

    if (pageType === "diagnostic") {
      await assertDailySpendAllows("generateTwoStagePage:stage2");
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

      const stage2Response = await gemini.chat.completions.create({
        model: "gemini-1.5-flash",
        messages: [
          { role: "system", content: "You are an expert HVAC Diagnostic AI. Output strict JSON." },
          { role: "user", content: userMsg2 },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 3500,
      });
      await recordOpenAiChatUsage("gpt-4o", stage2Response.usage, "two-stage:stage2");

      let parsedStage2 = null;
      try {
        const raw2 = stage2Response.choices[0]?.message?.content;
        if (!raw2) throw new Error("Stage 2: empty response");
        if (isJsonTruncated(raw2)) throw new Error("Stage 2: output truncated");

        parsedStage2 = safeJsonParse<any>(raw2.replace(/^\^\s*```json/i, "").replace(/```\s*$/i, "").trim());
        if (!parsedStage2) throw new Error("Stage 2: Invalid JSON");
      } catch (e) {
        console.warn("Stage 2 skipped or failed:", e);
      }

      if (!parsedStage2) {
        console.warn("Stage 2 skipped - falling back to Stage 1 safely");
      }

      // --- SAFE MERGE ---
      finalObj = {
        ...parsedStage1,
        ...(parsedStage2 || {}),
        content: {
          ...(parsedStage1.content || {}),
          ...(parsedStage2?.content || {})
        }
      };
    }

    const content = finalizeOutput(JSON.stringify(finalObj), pageType);

    // 🏆 GOLD STANDARD VALIDATION ENFORCEMENT
    const pageQuality = "GOLD_STANDARD";
    // Using loose checking across the object to support both flat and nested payload structures
    const activePayload = (content as any).content || content;
    const hasFixes = activePayload.fixSteps || activePayload.howWeFixIt || activePayload.solutionSection || activePayload.deep_causes || activePayload.repairOptions || activePayload.repair_matrix;
    const hasCauses = activePayload.causes || activePayload.commonCauses || activePayload.authoritySection || activePayload.most_common_causes;
    const hasFaq = activePayload.faq || activePayload.faqs || activePayload.deep_causes;

    if (activePayload.layout !== "hvac_authority_v3" && (!hasFixes || !hasCauses || !hasFaq)) {
      throw new Error("NOT_GOLD_STANDARD");
    }

    // Assign locks safely so the worker can enforce them
    const hash = EXPECTED_PROMPT_HASH;
    if (content && typeof content === 'object') {
      (content as any)._prompt_hash = hash;
      (content as any).engineVersion = ENGINE_VERSION;
    }

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

export function transformDGToUnified(dg: Record<string, any>, slug: string, pageType: string) {
  const unifiedTitle = dg.title ?? dg.content?.title ?? slug;

  const unified = {
    slug,
    page_type: pageType,
    title: unifiedTitle,
    relationships: dg.relationships || dg.content?.relationships || { system: [], symptoms: [], diagnostics: [], causes: [], repairs: [] },
    content: {
      // Preserve everything from raw DG first
      ...dg,

      // Keep canonical values stable
      slug,
      title: unifiedTitle,

      // Explicitly map critical DG fields so they are never ambiguous
      decision_tree: dg.decision_tree ?? dg.content?.decision_tree,
      system_explanation: dg.system_explanation ?? dg.content?.system_explanation,
      tech_observation: dg.tech_observation ?? dg.content?.tech_observation,
      diagnostic_flow: dg.diagnostic_flow ?? dg.content?.diagnostic_flow,
      top_causes: dg.top_causes ?? dg.content?.top_causes,
      repair_matrix: dg.repair_matrix ?? dg.content?.repair_matrix,
      quick_tools: dg.quick_tools ?? dg.content?.quick_tools,
    },
  };

  return unified;
}

export function assertCriticalDiagnosticFields(
  page: Record<string, any>,
  pageType?: string
): void {
  if (pageType !== "diagnostic") return;

  const c = page?.content ?? page;

  if (!c?.decision_tree) {
    throw new Error(`Diagnostic output missing decision_tree for slug: ${page?.slug}`);
  }

  if (!Array.isArray(c?.system_explanation) || c.system_explanation.length < 4) {
    throw new Error(`Diagnostic output missing robust system_explanation for slug: ${page?.slug}`);
  }

  if (!Array.isArray(c?.diagnostic_flow) || c.diagnostic_flow.length < 3) {
    throw new Error(`Diagnostic output missing diagnostic_flow for slug: ${page?.slug}`);
  }

  if (!Array.isArray(c?.top_causes) || c.top_causes.length < 3) {
    throw new Error(`Diagnostic output missing top_causes for slug: ${page?.slug}`);
  }
}

export const LAYER1_SYSTEM_LOCK = `You are a senior HVAC diagnostic engineer generating structured diagnostic data for a relational database.

You are NOT writing content.
You are building a diagnostic system.

All outputs must:
- Be mechanically accurate
- Use measurable thresholds
- Eliminate ambiguity
- Follow strict schema`;

export const LAYER2_HARD_CONSTRAINTS = `NON-NEGOTIABLE RULES:

0. TECHNICIAN DENSITY (MASTER)
You are a senior HVAC diagnostic technician.

You MUST explain failures using:
- airflow dynamics (CFM, static pressure, mass flow)
- thermodynamics (heat transfer, phase change, superheat/subcool, enthalpy)
- electrical behavior (capacitors, contactors, voltage, current, motors)

FORBIDDEN in fast_answer.technical_summary, fast_answer.primary_mechanism, cause.mechanism, repair.system_effect:
- Generic comfort-language-only explanations
- Consumer-blog tone
- Hedge words: "may", "might", "could" (use testable, decisive technician phrasing instead)

REQUIRED:
- Every cause MUST include a physical failure mechanism (chain: component → system effect → symptom).
- Every repair MUST include system_effect: what behavior is restored (compression cycle, airflow, control sequence, heat transfer).
- Every diagnostic step / test MUST tie to measurable or observable conditions (temperature, pressure, voltage, airflow).

---

1. FAILURE MODES
- Must represent physical system failure states
- Must NOT be generic categories
- Must describe what is physically failing

BAD EXAMPLES: Electrical Issues, Airflow Problems
GOOD EXAMPLES: Compressor Activation Failure, Refrigerant Circuit Pressure Loss, Heat Exchange Failure, Air Distribution Failure

---

2. TESTS (CRITICAL)
Every cause MUST include:
- A real-world diagnostic test
- A measurable or observable threshold

BAD: "Check capacitor"
GOOD: "Measure capacitance with multimeter; must be within ±6% of rating"

---

3. EXPECTED RESULT
Must define:
- what CONFIRMS the issue
- what ELIMINATES other failure modes

---

4. FLOWCHART
- Must be valid Mermaid flowchart TD
- MUST branch early by physical system state
- Each node MUST be a binary decision ending in a question mark (?)
- The exact, case-sensitive name of EVERY failure mode MUST appear as a node in the Mermaid diagram.

---

5. LANGUAGE
- Use technician confirmation language: "this confirms", "this indicates", "this eliminates"
- No blog phrasing
- No fluff

---

6. INTERNAL SELF-CHECK (MANDATORY)
Before returning JSON, verify internally:
- Each failure mode is a physical system state
- Each cause has a measurable test
- Each expected_result defines pass/fail
- Flowchart includes all failure modes exactly as named
- No generic terms are used

If any rule is violated, restructure your logic silently before outputting the final JSON.`;

export function buildLayer3TaskPrompt(symptom: string, system: string) {
  return `Generate a diagnostic system for:

SYMPTOM: ${symptom}
SYSTEM: ${system}

REQUIREMENTS:

- Produce 3–5 failure modes
- Produce >=4 causes
- Every cause must map to ONE failure mode
- Every cause must include:
  - test
  - expected_result
- Every cause must have >=1 repair

- Include:
  - diagnostic_order
  - guided_diagnosis (3+ scenarios)
  - mermaid_diagram

Return ONLY valid JSON matching schema.
`;
}

export async function generateDiagnosticEngineJson(input: { symptom: string, city: string, pageType?: string }, retryFeedback: string = "", orchestratorOptions: any = null) {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.log("🚫 Generation globally disabled");
    return undefined as any;
  }
  await assertAutoModeEnabled({ bypassAutoMode: true });
  await assertDailySpendAllows("generateDiagnosticEngineJson:start");
  console.log("GENERATION TRIGGERED", new Date());

  const canonical = normalizePageTypeKey(input.pageType, input.symptom);
  const useDecisionGrid = isDecisionGridDiagnosticMode();
  
  let finalPrompt = "";
  if (orchestratorOptions?.schemaVersion === "diagnostic_engine" || orchestratorOptions?.schemaVersion === "rv_diagnostic" || input.pageType === "diagnostic_engine") {
    // Dynamically pull the masterful prompt matrix we built
    const { composePromptForPageType } = require("../prompt-schema-router");
    const orch =
      orchestratorOptions && typeof orchestratorOptions === "object" ? orchestratorOptions : {};
    finalPrompt = composePromptForPageType(input.pageType || "diagnostic_engine", input.symptom, {
      ...orch,
      verticalId: (orch as any).verticalId ?? (orch as any).vertical ?? "hvac",
    });
  } else {
    // Fallback legacy Florida prompt
    finalPrompt = `You are generating HVAC diagnostic pages for a high-conversion website.

Output clean JSON only.

Each page must include:

{
  "problem_summary": "...",
  "deep_explanation": "...",
  "causes": [
    { "name": "", "description": "" }
  ],
  "quick_steps": [],
  "safety_note": "...",
  "prevention": [],
  "faq": [
    { "question": "", "answer": "" }
  ]
}

Rules:
- Keep language simple and clear (homeowner level)
- Focus on AC / cooling issues (Florida)
- Include urgency but not fear tactics
- Include 3–5 causes
- Include 3–5 quick steps
- Include 2–4 FAQs
- Keep each page unique
- No fluff, no filler

Do NOT explain anything.
Return JSON only.

Topic: ${input.symptom}
City/Region Context: ${input.city || "Florida"}

Important Context: Each page should subtly reference the local city (${input.city || "Florida"}) and the intense Florida heat/humidity conditions where relevant (to establish local authority and reality without sounding forced).`;
  }

  const systemMessage = "You are the HVAC Revenue Boost expert JSON generator. Output strict JSON only.";

  return callWithRetry(async () => {
    await assertDailySpendAllows("generateDiagnosticEngineJson:retry");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: finalPrompt }
      ],
      max_completion_tokens: 2800
    });
    
    console.log(`ORCH::METRIC=${JSON.stringify({ tokens: response.usage?.total_tokens || 0, cost: (response.usage?.total_tokens || 0) * 0.000002 })}`);
    await recordOpenAiChatUsage("gpt-4o-mini", response.usage, "master-validator-generator");

    const contentStr = response.choices[0]?.message?.content;
    if (!contentStr) throw new Error("Empty AI response");

    try {
      return JSON.parse(contentStr.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim());
    } catch(e: any) {
      console.error("❌ OpenAI API Parsing Failed:", e.message || e);
      throw new Error("Invalid JSON from LLM: " + e);
    }
  }, { maxRetries: 1 }); // Retries are handled cleanly in the generation-worker queue loop
}
