/**
 * Two-Stage Graph-Aware Content Generator
 * ---------------------------------------
 * Stage 1 = DEFINE STRUCTURE (minimal, stable)
 * Stage 2 = ENRICH EXISTING STRUCTURE (no new entities)
 *
 * AI MUST NOT invent structure in Stage 2.
 * @see docs/TWO-STAGE-ARCHITECTURE.md
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import sql from "@/lib/db";
import { safeJsonParse, normalizeToString, isJsonTruncated } from "@/lib/utils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Fetch cause seed by name from DB.
 * Step 3: Inject into Stage 2. causes_seed first → fallback to causes.
 */
async function getCauseSeedByName(
  causeName: string
): Promise<Record<string, unknown> | null> {
  const normalized = normalizeToString(causeName).trim().toLowerCase();
  if (!normalized) return null;

  try {
    // 1️⃣ Try causes_seed
    const seedRows = await sql`
      SELECT * FROM causes_seed
      WHERE LOWER(TRIM(name)) = ${normalized}
      LIMIT 1
    `;
    if ((seedRows as any[]).length > 0) {
      return (seedRows as any[])[0];
    }
  } catch {
    /* causes_seed may not exist */
  }

  // 2️⃣ Fallback to causes table
  const causeRows = await sql`
    SELECT * FROM causes
    WHERE LOWER(TRIM(name)) = ${normalized}
    LIMIT 1
  `;
  if ((causeRows as any[]).length > 0) {
    return (causeRows as any[])[0];
  }

  return null;
}

// --- STAGE 1 TYPES ---

export interface Stage1Core {
  slug: string;
  title: string;
  system: string;
  symptom: string;
  fast_answer: string;
  summary_30_sec: string;
  difficulty: string;
  diagnostic_steps: { step: number; action: string }[];
  causes: { name: string; confidence: string }[];
  repairs: { name: string; difficulty: string }[];
}

// --- STAGE 2 TYPES ---

export interface Stage2Enrichment {
  slug: string;
  cause_details: {
    name: string;
    explanation: string;
    symptoms: string[];
    related_components: string[];
  }[];
  repair_details: {
    name: string;
    steps: string[];
    tools: string[];
    cost: string;
  }[];
  tools: { name: string; purpose: string }[];
  faq: { question: string; answer: string }[];
  internal_links: { anchor: string; slug: string }[];
}

// --- VALIDATION ---

const REQUIRED_STAGE1_KEYS = [
  "slug",
  "title",
  "system",
  "symptom",
  "fast_answer",
  "summary_30_sec",
  "difficulty",
  "diagnostic_steps",
  "causes",
  "repairs",
] as const;


function validateStage1Output(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Output is not an object"] };
  }
  const obj = data as Record<string, unknown>;
  for (const key of REQUIRED_STAGE1_KEYS) {
    if (!(key in obj)) errors.push(`Missing required key: ${key}`);
  }
  if (Array.isArray(obj.causes) && obj.causes.length > 3) {
    errors.push("causes exceeds max 3");
  }
  if (Array.isArray(obj.repairs) && obj.repairs.length > 3) {
    errors.push("repairs exceeds max 3");
  }
  if (Array.isArray(obj.diagnostic_steps) && obj.diagnostic_steps.length > 3) {
    errors.push("diagnostic_steps exceeds max 3");
  }
  return { valid: errors.length === 0, errors };
}

// --- RETRY ---

async function callWithRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; lowerTempOnRetry?: boolean } = {}
): Promise<T> {
  const { maxRetries = 3, lowerTempOnRetry = true } = options;
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
  throw lastError;
}

// --- STAGE 1 ---

const STAGE1_PROMPT = `You are a senior HVAC diagnostic engineer. Generate MINIMAL core page structure only.

STAGE 1 RULES (CRITICAL - STRICT LIMITS):
- causes ≤ 3 (exactly 3 or fewer)
- repairs ≤ 3 (exactly 3 or fewer)
- diagnostic_steps ≤ 3 (exactly 3 or fewer)
- Short sentences only (max 1 sentence per field)
- ALL arrays must contain objects (no raw strings)
- Output valid JSON only. No markdown. End with closing brace.

SCHEMA:
{
  "slug": "kebab-case-slug",
  "title": "Page Title",
  "system": "HVAC",
  "symptom": "symptom name",
  "fast_answer": "1 sentence",
  "summary_30_sec": "1 sentence",
  "difficulty": "easy|moderate|advanced",
  "diagnostic_steps": [{"step": 1, "action": "short action"}],
  "causes": [{"name": "cause name", "confidence": "high|medium|low"}],
  "repairs": [{"name": "repair name", "difficulty": "easy|moderate|advanced"}]
}`;

export async function generateCorePage(
  problem: string,
  options: {
    slug?: string;
    system?: string;
    graphCauses?: { name: string }[];
    graphRepairs?: { name: string }[];
  } = {}
): Promise<Stage1Core> {
  const { slug = "", system = "HVAC", graphCauses = [], graphRepairs = [] } = options;

  return callWithRetry(async () => {
    const userMsg = `Generate core page for: ${problem}
${graphCauses.length ? `Known causes (use these names): ${graphCauses.map((c) => normalizeToString(c.name)).join(", ")}` : ""}
${graphRepairs.length ? `Known repairs (use these names): ${graphRepairs.map((r) => normalizeToString(r.name)).join(", ")}` : ""}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: STAGE1_PROMPT },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 850,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Stage 1: empty response");

    if (isJsonTruncated(raw)) {
      throw new Error("Stage 1: output truncated (missing closing brace)");
    }

    const parsed = safeJsonParse<Stage1Core>(raw);
    if (!parsed) throw new Error("Stage 1: unrecoverable JSON");

    const { valid, errors } = validateStage1Output(parsed);
    if (!valid) {
      throw new Error(`Stage 1 validation failed: ${errors.join(", ")}`);
    }

    // Enforce max 3
    if (parsed.causes?.length > 3) parsed.causes = parsed.causes.slice(0, 3);
    if (parsed.repairs?.length > 3) parsed.repairs = parsed.repairs.slice(0, 3);
    if (parsed.diagnostic_steps?.length > 3)
      parsed.diagnostic_steps = parsed.diagnostic_steps.slice(0, 3);

    if (slug) parsed.slug = slug;
    return parsed;
  });
}

// --- STAGE 2 ---

const STAGE2_PROMPT = `You are a senior HVAC diagnostic engineer. ENRICH existing structure only.

STAGE 2 HARD RULES (CRITICAL):
- DO NOT create new causes or repairs
- ONLY expand entities from Stage 1
- Match cause/repair names EXACTLY
- Use graph data when provided
- Keep outputs modular and concise

SCHEMA:
{
  "slug": "same as Stage 1",
  "cause_details": [{"name": "exact cause name", "explanation": "2-3 sentences", "symptoms": [], "related_components": []}],
  "repair_details": [{"name": "exact repair name", "steps": [], "tools": [], "cost": "string"}],
  "tools": [{"name": "string", "purpose": "string"}],
  "faq": [{"question": "string", "answer": "short"}],
  "internal_links": [{"anchor": "string", "slug": "string"}]
}`;

export async function generateEnrichment(
  core: Stage1Core,
  options: {
    graphComponents?: string[];
    graphRelatedSlugs?: string[];
    graphData?: Record<string, unknown>;
  } = {}
): Promise<Stage2Enrichment> {
  const { graphComponents = [], graphRelatedSlugs = [], graphData = {} } = options;

  return callWithRetry(
    async () => {
      const causeNames = (core.causes || []).map((c) => normalizeToString(c.name)).join(", ");
      const repairNames = (core.repairs || []).map((r) => normalizeToString(r.name)).join(", ");

      // Inject seed data per cause (Step 3)
      const causeSeeds: Record<string, Record<string, unknown>> = {};
      for (const cause of core.causes || []) {
        const name = normalizeToString(cause.name);
        if (name) {
          const seed = await getCauseSeedByName(name);
          causeSeeds[name] = seed ?? {};
        }
      }

      const prompt = {
        cause: causeNames,
        repair: repairNames,
        seed: causeSeeds,
        graph: graphData,
      };

      const userMsg = `Enrich this core page. Match names EXACTLY.

Core causes: ${causeNames}
Core repairs: ${repairNames}
${graphComponents.length ? `Related components: ${graphComponents.join(", ")}` : ""}
${graphRelatedSlugs.length ? `Internal link slugs: ${graphRelatedSlugs.join(", ")}` : ""}

Seed data (use when available): ${JSON.stringify(prompt.seed, null, 0).slice(0, 1500)}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: STAGE2_PROMPT },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 1100,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) throw new Error("Stage 2: empty response");

      if (isJsonTruncated(raw)) {
        throw new Error("Stage 2: output truncated (missing closing brace)");
      }

      const parsed = safeJsonParse<Stage2Enrichment>(raw);
      if (!parsed) throw new Error("Stage 2: unrecoverable JSON");

      parsed.slug = core.slug;
      return parsed;
    },
    { maxRetries: 3, lowerTempOnRetry: true }
  );
}

// --- MERGE & CONVERT ---

/**
 * Merge Stage 1 + Stage 2 into content_json format for symptom-page template.
 */
export function mergeTwoStageToContentJson(
  core: Stage1Core,
  enrichment: Stage2Enrichment
): Record<string, unknown> {
  const causeDetails = enrichment.cause_details || [];
  const repairDetails = enrichment.repair_details || [];

  const causes = (core.causes || []).map((c) => {
    const name = normalizeToString(c.name);
    const detail = causeDetails.find(
      (d) => normalizeToString(d.name).toLowerCase() === name.toLowerCase()
    );
    return {
      name,
      explanation: detail?.explanation || "",
      difficulty: c.confidence === "high" ? "Easy" : "Moderate",
      difficultyColor: "text-hvac-blue",
      cost: "$50–$450",
      repairs: (core.repairs || [])
        .filter((r) => {
          const rName = normalizeToString(r.name);
          const rd = repairDetails.find(
            (d) => normalizeToString(d.name).toLowerCase() === rName.toLowerCase()
          );
          return rd;
        })
        .map((r) => ({
          name: normalizeToString(r.name),
          slug: normalizeToString(r.name).toLowerCase().replace(/\s+/g, "-"),
          link: `/fix/${normalizeToString(r.name).toLowerCase().replace(/\s+/g, "-")}`,
        })),
    };
  });

  const repairs = (core.repairs || []).map((r) => {
    const name = normalizeToString(r.name);
    const detail = repairDetails.find(
      (d) => normalizeToString(d.name).toLowerCase() === name.toLowerCase()
    );
    return {
      name,
      difficulty: r.difficulty || "moderate",
      difficultyBg: r.difficulty === "advanced" ? "bg-hvac-safety" : "bg-hvac-gold",
      cost: detail?.cost || "$50–$150",
      diyText: r.difficulty === "easy" ? "Yes" : "Not recommended",
      diyColor: r.difficulty === "easy" ? "text-green-600" : "text-hvac-safety",
    };
  });

  return {
    layout: "diagnostic_first",
    sections: {},
    slug: core.slug,
    title: core.title,
    fast_answer: core.fast_answer,
    summary: core.summary_30_sec,
    diagnostic_steps: (core.diagnostic_steps || []).map((s) =>
      typeof s === "object" && s?.action ? s.action : normalizeToString(s)
    ),
    diagnostic_tree_mermaid: null,
    causes,
    repairs,
    tools_required: (enrichment.tools || []).map((t) => ({
      name: normalizeToString(t.name),
      reason: normalizeToString(t.purpose),
    })),
    faq: enrichment.faq || [],
    internal_links: (enrichment.internal_links || []).map((l) => ({
      type: "symptom",
      slug: normalizeToString(l.slug),
      anchor: normalizeToString(l.anchor),
    })),
    engine_version: "7.0.0-TwoStage-GraphAware",
    generated_at: new Date().toISOString(),
  };
}

/** Empty enrichment for core-only mode */
const EMPTY_ENRICHMENT: Stage2Enrichment = {
  slug: "",
  cause_details: [],
  repair_details: [],
  tools: [],
  faq: [],
  internal_links: [],
};

/**
 * Stage 1 ONLY — Core generation, no enrichment.
 * Use for canary / validation. Enrichment disabled.
 */
export async function generateCoreOnlyPage(
  problem: string,
  options: {
    slug?: string;
    system?: string;
    graphCauses?: { name: string }[];
    graphRepairs?: { name: string }[];
  } = {}
): Promise<Record<string, unknown>> {
  console.log("📦 Stage 1 ONLY: Generating core structure (enrichment disabled)...");
  const core = await generateCorePage(problem, {
    slug: options.slug,
    system: options.system,
    graphCauses: options.graphCauses,
    graphRepairs: options.graphRepairs,
  });
  return mergeTwoStageToContentJson(core, { ...EMPTY_ENRICHMENT, slug: core.slug });
}

/**
 * Full two-stage pipeline: Core → Enrich → Merge
 * Set USE_CORE_ONLY=true to skip enrichment (Stage 1 only).
 */
export async function generateTwoStagePage(
  problem: string,
  options: {
    slug?: string;
    system?: string;
    graphCauses?: { name: string }[];
    graphRepairs?: { name: string }[];
    graphComponents?: string[];
    graphRelatedSlugs?: string[];
    graphData?: Record<string, unknown>;
    coreOnly?: boolean;
  } = {}
): Promise<Record<string, unknown>> {
  const coreOnly = options.coreOnly ?? process.env.USE_CORE_ONLY === "true";

  console.log("📦 Stage 1: Generating core structure...");
  const core = await generateCorePage(problem, {
    slug: options.slug,
    system: options.system,
    graphCauses: options.graphCauses,
    graphRepairs: options.graphRepairs,
  });

  if (coreOnly) {
    // queueEnrichment(slug) — commented out for canary
    return mergeTwoStageToContentJson(core, { ...EMPTY_ENRICHMENT, slug: core.slug });
  }

  console.log("📦 Stage 2: Enriching from graph + seed...");
  const enrichment = await generateEnrichment(core, {
    graphComponents: options.graphComponents,
    graphRelatedSlugs: options.graphRelatedSlugs,
    graphData: options.graphData ?? {
      causes: options.graphCauses,
      repairs: options.graphRepairs,
    },
  });

  return mergeTwoStageToContentJson(core, enrichment);
}
