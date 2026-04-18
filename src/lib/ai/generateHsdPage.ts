import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import {
  assertDailySpendAllows,
  recordOpenAiChatUsage,
} from "@/lib/ai-spend-guard";
import { assertAutoModeEnabled } from "@/lib/generation-guards";
import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import { enforceStoredSlug } from "@/lib/slug-utils";
import type { ServiceVertical } from "@/lib/localized-city-path";
import {
  buildVerticalPromptPreamble,
  normalizeVerticalId,
} from "@/lib/verticals";
import {
  parseCityStateForPrompt,
} from "@/lib/prompt-schema-router";
import { buildHsdV2VeteranTechnicianPrompt } from "@/src/lib/ai/prompts/diagnostic-engine-json";
import { assertHsdV25ContentRules } from "@/lib/hsd/assertHsdV25ContentRules";
import { HSDV25Schema, type HsdV25Payload } from "@/lib/validation/hsdV25Schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const HSD_V2_SYSTEM =
  "You are a senior field service diagnostic technician (HVAC, plumbing, electrical). Generate structured JSON for React UI — plain text fields only, no HTML tags, no line breaks inside single strings. Diagnose like a tech on site: mechanical cause chains, escalation, and costs; avoid hedging and shallow filler. Output one complete JSON object only. No markdown fences. No commentary outside JSON. Include diagnostic_flow (at least 4 nodes and 3 edges), repair_matrix (4+ rows with numeric cost_min/cost_max), and every array must meet the contract minimums — undersized or invalid graphs cause hard rejection.";

export type GenerateHsdPageInput = {
  symptom: string;
  city: string;
  state: string;
  vertical?: ServiceVertical;
  /** Appended to the user prompt on retries / repair. */
  retryFeedback?: string;
};

export type HsdGeneratedPageEnvelope = {
  city: string;
  symptom: string;
  vertical: ServiceVertical;
};

export type GenerateHsdPageResult = HsdV25Payload & HsdGeneratedPageEnvelope;

export function slugifySymptomSegment(symptom: string): string {
  const s = symptom.trim();
  const parts = s.split("/").filter(Boolean);
  if (parts.length === 3 && /^(hvac|plumbing|electrical)$/i.test(parts[0] ?? "")) {
    return parts[1].toLowerCase();
  }
  if (!/\s/.test(s) && !s.includes(",")) {
    return s.replace(/^\/+/, "").toLowerCase();
  }
  return s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugifyCityState(city: string, state: string): string {
  const cityHead = city.split(",")[0].trim();
  const c = cityHead
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const st = state.trim().toLowerCase().replace(/[^a-z]/g, "");
  return `${c}-${st}`;
}

function formatCityStateLine(city: string, state: string): string {
  const c = city.trim();
  const st = state.trim();
  if (/,\s*[a-z]{2}\s*$/i.test(c)) return c;
  if (c && st) return `${c}, ${st.toUpperCase()}`;
  return c || st.toUpperCase();
}

function primaryIssueLabel(symptom: string): string {
  const pillar = slugifySymptomSegment(symptom);
  return pillar
    .split("-")
    .filter(Boolean)
    .map((w) =>
      ["ac", "hvac", "rv", "fl", "uv", "diy"].includes(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
}

/** Full user message for HSD v2 (v2.5) — INPUT block + vertical + slug seed. */
export function buildPrompt(
  symptom: string,
  city: string,
  state: string,
  storageSlug: string,
  vertical: ServiceVertical
): string {
  const { city: cOut, state: sOut } = parseCityStateForPrompt(city, state);
  const cityLine = cOut.trim() || city.trim();
  const stateLine = sOut.trim() || state.trim();
  const symptomLine = /\s/.test(symptom.trim()) ? symptom.trim() : primaryIssueLabel(symptom);

  const core = buildHsdV2VeteranTechnicianPrompt(symptomLine, cityLine, stateLine);
  const preamble = buildVerticalPromptPreamble(normalizeVerticalId(vertical));
  const topicLine = `PRIMARY PAGE SLUG / TOPIC SEED: "${enforceStoredSlug(storageSlug)}"`;
  if (!preamble) {
    return `${topicLine}\n\n---\n\n${core}`;
  }
  return `${preamble}\n\n${topicLine}\n\n---\n\n${core}`;
}

/** OpenAI JSON completion (same model family as `generateDiagnosticEngineJson`). */
export async function callLLM(userPrompt: string, retryFeedback: string = ""): Promise<string> {
  if (process.env.GENERATION_ENABLED !== "true") {
    throw new Error("GENERATION_ENABLED must be 'true' to call callLLM");
  }
  await assertAutoModeEnabled({ bypassAutoMode: true });
  await assertDailySpendAllows("generateHsdPage:callLLM");

  const user =
    retryFeedback.trim().length > 0
      ? `${userPrompt}\n\n---\n\n${retryFeedback.trim()}`
      : userPrompt;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: HSD_V2_SYSTEM },
      { role: "user", content: user },
    ],
    max_completion_tokens: 8192,
  });

  await recordOpenAiChatUsage("gpt-4o-mini", response.usage, "generate-hsd-page");

  const contentStr = response.choices[0]?.message?.content;
  if (!contentStr) throw new Error("callLLM: empty model response");
  return contentStr.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim();
}

/**
 * One LLM round-trip + Zod parse (no {@link assertHsdV25ContentRules}).
 * Prefer {@link generateHsdPageWithRetry} or {@link generateHsdPage} for production.
 */
export async function generateHsdPageAttempt(
  input: GenerateHsdPageInput
): Promise<GenerateHsdPageResult> {
  const vertical = (input.vertical ?? "hvac") as ServiceVertical;
  const pillar = slugifySymptomSegment(input.symptom);
  const cityState = slugifyCityState(input.city, input.state);
  const storageSlug = enforceStoredSlug(`${vertical}/${pillar}/${cityState}`);
  const displayCity = formatCityStateLine(input.city, input.state);

  const prompt = buildPrompt(input.symptom, input.city, input.state, storageSlug, vertical);
  const raw = await callLLM(prompt, input.retryFeedback ?? "");

  const json = JSON.parse(raw) as Record<string, unknown>;

  json.schema_version = HSD_V2_SCHEMA_VERSION;
  json.page_type = "city_symptom";
  json.slug = storageSlug;

  const parsed = HSDV25Schema.safeParse(json);
  if (!parsed.success) {
    console.error(parsed.error.flatten());
    throw new Error("Invalid HSD page");
  }

  return {
    ...parsed.data,
    city: displayCity,
    symptom: primaryIssueLabel(input.symptom),
    vertical,
  };
}

/**
 * Generate with up to `retries + 1` attempts. Each successful Zod parse is checked with
 * {@link assertHsdV25ContentRules}; failures feed back into the next prompt.
 *
 * @param retries Number of *extra* tries after the first (default 2 → 3 attempts total).
 */
export async function generateHsdPageWithRetry(
  input: GenerateHsdPageInput,
  retries = 2
): Promise<GenerateHsdPageResult> {
  let feedback = input.retryFeedback ?? "";
  for (let i = 0; i <= retries; i++) {
    try {
      const page = await generateHsdPageAttempt({ ...input, retryFeedback: feedback });
      assertHsdV25ContentRules(page);
      return page;
    } catch (err) {
      if (i === retries) throw err;
      feedback = [
        input.retryFeedback?.trim(),
        `Previous attempt failed (${i + 1}/${retries + 1}). Return one corrected JSON object only.`,
        err instanceof Error ? err.message : String(err),
      ]
        .filter(Boolean)
        .join("\n\n");
    }
  }
  throw new Error("generateHsdPageWithRetry: exhausted retries");
}

/**
 * Generate one **hsd_v2** city_symptom JSON (Zod + content rules), with **2** retries by default
 * (3 model attempts). Flow: {@link generateHsdPageWithRetry} → `upsertPage` / queue worker.
 */
export async function generateHsdPage(input: GenerateHsdPageInput): Promise<GenerateHsdPageResult> {
  return generateHsdPageWithRetry(input, 2);
}

/** Alias for {@link generateHsdPageWithRetry} — optional second argument is `retries` (default `2`). */
export const generateWithRetry = generateHsdPageWithRetry;
