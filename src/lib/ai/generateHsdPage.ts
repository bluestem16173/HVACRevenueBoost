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
import {
  buildHsdV2VeteranTechnicianPrompt,
  HSD_CITY_OVERLAY,
  HSD_HARD_ENFORCEMENT_RULES,
  HSD_MASTER_FIELD_AUTHORITY_LAYER,
  HSD_MASTER_IDEMPOTENT,
  HSD_PILLAR_AUTHORITY_OVERRIDE,
} from "@/src/lib/ai/prompts/diagnostic-engine-json";
import { ELECTRICAL_AUTHORITY_PROMPT } from "@/src/lib/ai/prompts/hsdElectricalPromptAnnex";
import { hsdVerticalPromptAnnex } from "@/src/lib/ai/prompts/hsdVerticalPromptAnnex";
import { finalizeHsdV25Page } from "@/lib/hsd/finalizeHsdPage";
import {
  applyLeeCountyLocalizedEnrichmentToHsdJson,
  isLeeCountyCityStorageSlug,
} from "@/lib/homeservice/leeCountyLocalizedEnrichment";
import { patchHsdLlmJsonMinimumGates } from "@/lib/hsd/patchHsdLlmJsonMinimumGates";
import { HSDV25Schema, type HsdV25Payload } from "@/lib/validation/hsdV25Schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const HSD_V2_SYSTEM =
  "You are a senior field service diagnostic technician (HVAC, plumbing, electrical). Build scan-decide-act diagnostic JSON for React — plain text only, no HTML, no line breaks inside any single string (exception: summary_30s.flow_lines = one short line per array item). No hedging (avoid may/might/could). Limit verbatim repetition across the whole JSON. Output one JSON object only; no markdown fences; no commentary. MATCH THE USER PROMPT FREEZE: no Understanding-style intros; max 2 canonical_truths; must include quick_table (≥4 rows), decision (safe/call_pro/stop_now each ≥2 lines), cost_escalation (≥4 stages with $). Also: flow_lines (3–5 for triage scan), what_this_means (100+), repair_matrix_intro, decision_footer, diagnostic_flow, tools, repair_matrix (4+ rows, one cost_max ≥ 1500), final_warning (60+ with $), cta (45+ with city load). For localized pages (slug has city segment): include cityContext (2–4 strings: humidity/runtime, coastal corrosion, cycling wear) at top of page contract; national pillars use cityContext: []. Saves run assertHsdV26AuthorityRules — invalid payloads are rejected.";

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

/**
 * Full user message for HSD v2 (v2.5) — INPUT block + vertical + slug seed.
 * Electrical: uses `ELECTRICAL_AUTHORITY_PROMPT` as the vertical annex (**v1 locked** master diagnostic engine — city_symptom + JSON contract).
 */
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
  const slugNorm = enforceStoredSlug(storageSlug);
  const topicLine = `PRIMARY PAGE SLUG / TOPIC SEED: "${slugNorm}"`;
  const verticalAnnex =
    vertical === "electrical" ? ELECTRICAL_AUTHORITY_PROMPT : hsdVerticalPromptAnnex(vertical, slugNorm);
  const leeBlock = isLeeCountyCityStorageSlug(slugNorm)
    ? `\n\n---\n\nLOCAL MARKET (Lee County — **context layer only**):\n- REGION: Lee County, Florida\n- CLIMATE: hot, humid, coastal\n- PRIMARY CITY: match the slug city segment (e.g. Cape Coral, Fort Myers Beach, Sanibel, North Captiva) in **cityContext**, **title**, and **cta** — do not substitute a different city name.\n- BARRIER / ISLAND SEGMENTS (Sanibel, North Captiva, Fort Myers Beach): salt fog, storm rebuild, logistics, and generator-backed homes belong in **cityContext** bullets—not new diagnostic branches.\n- **LOCALIZATION FREEZE:** vary **cityContext** (2–4 bullets: canals, salt air, demand spikes, corrosion, storms as relevant) plus light city naming in headline/CTA only. **Do not** rewrite \`diagnostic_steps\`, \`flow_lines\`, \`what_this_means\`, \`quick_table\`, \`repair_matrix\`, or \`common_misdiagnosis\` per city—keep diagnostic logic identical to the national pillar; only the context layer changes.\n`
    : "";

  /** Lee County localized slugs use `…-fl`; national storage slugs omit that city segment. */
  const isPillar = !storageSlug.includes("-fl");
  const idempotentLayer = HSD_MASTER_IDEMPOTENT.replace(/\{\{symptom\}\}/g, symptomLine);
  const authorityLayer = HSD_MASTER_FIELD_AUTHORITY_LAYER;
  const modeLayer = isPillar ? HSD_PILLAR_AUTHORITY_OVERRIDE : HSD_CITY_OVERLAY;

  const assembled = [
    idempotentLayer,
    authorityLayer,
    HSD_HARD_ENFORCEMENT_RULES,
    modeLayer,
    `${topicLine}${leeBlock}`,
    verticalAnnex,
    "---",
    core,
  ].join("\n\n");

  if (!preamble) {
    return assembled;
  }
  return `${preamble}\n\n${assembled}`;
}

/** OpenAI JSON completion (same model family as `generateDiagnosticEngineJson`). */
export async function callLLM(
  userPrompt: string,
  retryFeedback: string = "",
  /** Logged on `ai_usage.source` — use `generate-hsd-page:{slug}:attempt-{n}` from {@link generateHsdPageAttempt}. */
  usageSource: string = "generate-hsd-page"
): Promise<string> {
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

  await recordOpenAiChatUsage("gpt-4o-mini", response.usage, usageSource);

  const contentStr = response.choices[0]?.message?.content;
  if (!contentStr) throw new Error("callLLM: empty model response");
  return contentStr.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim();
}

/**
 * One LLM round-trip + Zod safeParse + {@link finalizeHsdV25Page} (assert inside finalize).
 * Prefer {@link generateHsdPageWithRetry} or {@link generateHsdPage} for production — flow: **generate → finalize → save**.
 *
 * @param attempt 1-based index; each OpenAI call logs `ai_usage.source` =
 *   `generate-hsd-page:{storageSlug}:attempt-{attempt}` so retries are visible in spend reports.
 */
export async function generateHsdPageAttempt(
  input: GenerateHsdPageInput,
  attempt: number = 1
): Promise<GenerateHsdPageResult> {
  const vertical = (input.vertical ?? "hvac") as ServiceVertical;
  const pillar = slugifySymptomSegment(input.symptom);
  const cityState = slugifyCityState(input.city, input.state);
  const storageSlug = enforceStoredSlug(`${vertical}/${pillar}/${cityState}`);
  const displayCity = formatCityStateLine(input.city, input.state);

  if (!Number.isFinite(attempt) || attempt < 1 || attempt > 99) {
    throw new Error(`generateHsdPageAttempt: attempt must be 1–99, got ${attempt}`);
  }

  const prompt = buildPrompt(input.symptom, input.city, input.state, storageSlug, vertical);
  const raw = await callLLM(
    prompt,
    input.retryFeedback ?? "",
    `generate-hsd-page:${storageSlug}:attempt-${attempt}`
  );

  const json = JSON.parse(raw) as Record<string, unknown>;

  json.schema_version = HSD_V2_SCHEMA_VERSION;
  json.page_type = "city_symptom";
  json.slug = storageSlug;

  patchHsdLlmJsonMinimumGates(json);
  applyLeeCountyLocalizedEnrichmentToHsdJson(json, storageSlug, vertical);

  const parsed = HSDV25Schema.safeParse(json);
  if (!parsed.success) {
    console.error(parsed.error.flatten());
    throw new Error("Invalid HSD page");
  }

  const finalized = finalizeHsdV25Page(parsed.data);

  return {
    ...finalized,
    city: displayCity,
    symptom: primaryIssueLabel(input.symptom),
    vertical,
  };
}

/**
 * Generate with up to `retries + 1` attempts. Each successful parse runs {@link finalizeHsdV25Page}
 * (headline cleanup, scaffolding strip, truth budget, content assert); failures feed back into the next prompt.
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
      const page = await generateHsdPageAttempt({ ...input, retryFeedback: feedback }, i + 1);
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
