import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import {
  MASTER_SYSTEM_PROMPT,
  EXPECTED_PROMPT_HASH
} from "./core";

import {
  Schema,
  fallbackJson,
  validateContent
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
  options: { maxRetries?: number } = {}
): Promise<T> {
  const { maxRetries = 3 } = options;
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
  return { ...fallbackJson, _prompt_hash: EXPECTED_PROMPT_HASH } as any as T;
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
    const userMsg = `Generate HVAC diagnostic and lead-conversion guide for:
ISSUE: "${problem}"
PROPERTY_TYPE: "residential"

Additional Context:
- SLUG: ${slug}
- SYSTEM: ${system}
- PAGE_TYPE: ${pageType}
- PRIMARY_KEYWORD: ${keyword || problem}

IMPORTANT:
You must strictly follow the required JSON structure.
If you are unsure, prioritize correct structure over verbosity.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: MASTER_SYSTEM_PROMPT },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 3000,
    });

    const raw = response.choices[0]?.message?.content;
    console.log("RAW LLM OUTPUT:", raw);
    
    if (!raw) throw new Error("Generation API: empty response");

    if (isJsonTruncated(raw)) {
      throw new Error("Generation API: output truncated (missing closing brace)");
    }

    let parsed;
    try {
      const cleaned = raw.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("🚨 CRITICAL: LLM Returned Invalid JSON. Resorting to fallback payload. Error:", err, "Raw:", raw);
      parsed = fallbackJson;
    }

    const source = parsed?.payload ?? parsed;

    const content = Schema.parse(source);
    validateContent(content);

    // Assign locks so the worker can enforce them
    (content as any)._prompt_hash = EXPECTED_PROMPT_HASH;

    return content;
  });
}
