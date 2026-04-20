import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import {
  assertDailySpendAllows,
  recordOpenAiChatUsage,
} from "@/lib/ai-spend-guard";
import { assertAutoModeEnabled } from "@/lib/generation-guards";
import { coerceHsdJsonForV25View } from "@/lib/hsd/coerceHsdJsonForV25View";
import { finalizeHsdV25Page } from "@/lib/hsd/finalizeHsdPage";
import { patchHsdLlmJsonMinimumGates } from "@/lib/hsd/patchHsdLlmJsonMinimumGates";
import { problemPillarRawToHsdCandidate } from "@/lib/hsd/problemPillarRawToHsdCandidate";
import type { ServiceVertical } from "@/lib/localized-city-path";
import { DG_AUTHORITY_ENGINE_V4 } from "@/lib/dg/dgAuthorityEngineV4Prompt";
import { HSD_TIER1_PILLAR } from "@/prompts/hsdTier1Pillar";
import type { HsdV25Payload } from "@/src/lib/validation/hsdV25Schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM =
  "You output one JSON object only — no markdown fences, no commentary. Follow the user contract exactly.";

export type GenerateProblemPillarInput = {
  vertical: ServiceVertical;
  pillarSlug: string;
  retryFeedback?: string;
};

function buildUserPrompt(input: GenerateProblemPillarInput): string {
  const v = input.vertical;
  const s = String(input.pillarSlug ?? "")
    .trim()
    .toLowerCase();
  const seed = `TARGET:
- vertical: ${v}
- system: (use full trade name matching vertical, e.g. HVAC / Electrical / Plumbing)
- pillar symptom slug: ${s}
- national storage slug (no city segment): ${v}/${s}
- page_type: "problem_pillar"
- city: "" (national pillar; leave empty)

Fill "slug" in your JSON as "${v}/${s}". Obey the OUTPUT FORMAT and CTA RULES for this vertical.`;
  const fb = input.retryFeedback?.trim();
  /** Tier-1 authority brief first; V4 block supplies strict root JSON keys the mapper consumes. */
  const contract = [HSD_TIER1_PILLAR, DG_AUTHORITY_ENGINE_V4].join("\n\n---\n\n");
  return [contract, "---", seed, fb ? `---\n\n${fb}` : ""].filter(Boolean).join("\n\n");
}

async function callLlm(user: string): Promise<string> {
  if (process.env.GENERATION_ENABLED !== "true") {
    throw new Error("GENERATION_ENABLED must be 'true' to generate problem pillars");
  }
  await assertAutoModeEnabled({ bypassAutoMode: true });
  await assertDailySpendAllows("generateProblemPillarPage:callLlm");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    max_completion_tokens: 8192,
  });

  await recordOpenAiChatUsage("gpt-4o-mini", response.usage, "generate-problem-pillar-page");

  const contentStr = response.choices[0]?.message?.content;
  if (!contentStr) throw new Error("generateProblemPillarPage: empty model response");
  return contentStr.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim();
}

/**
 * **HSD_TIER1_PILLAR** + **DG_AUTHORITY_ENGINE_V4** (JSON appendix) → partial HSD → coerce → finalize.
 * Intended persistence: `pages.page_type = hsd`, `slug = {vertical}/{pillar}` (national pillar).
 */
export async function generateProblemPillarPageAttempt(
  input: GenerateProblemPillarInput
): Promise<HsdV25Payload> {
  const vertical = input.vertical;
  const pillarSlug = String(input.pillarSlug ?? "")
    .trim()
    .toLowerCase();
  if (!pillarSlug) throw new Error("generateProblemPillarPage: missing pillarSlug");

  const rawText = await callLlm(buildUserPrompt(input));
  const raw = JSON.parse(rawText) as Record<string, unknown>;
  if (!raw || typeof raw !== "object") throw new Error("generateProblemPillarPage: invalid JSON");

  const candidate = problemPillarRawToHsdCandidate(raw, vertical, pillarSlug);
  patchHsdLlmJsonMinimumGates(candidate);

  const coerced = coerceHsdJsonForV25View(candidate);
  if (!coerced) {
    throw new Error("generateProblemPillarPage: coerceHsdJsonForV25View returned null");
  }

  return finalizeHsdV25Page(coerced);
}

export async function generateProblemPillarPageWithRetry(
  input: GenerateProblemPillarInput,
  retries = 2
): Promise<HsdV25Payload> {
  let feedback = input.retryFeedback ?? "";
  for (let i = 0; i <= retries; i++) {
    try {
      return await generateProblemPillarPageAttempt({ ...input, retryFeedback: feedback });
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
  throw new Error("generateProblemPillarPageWithRetry: exhausted retries");
}

/** Convenience alias: same as `generateProblemPillarPageWithRetry` (default 2 retries). */
export async function generateProblemPillarPage(
  input: GenerateProblemPillarInput,
  retries = 2
): Promise<HsdV25Payload> {
  return generateProblemPillarPageWithRetry(input, retries);
}
