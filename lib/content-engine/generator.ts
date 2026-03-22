import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import {
  MASTER_SYMPTOM_PROMPT,
  MASTER_CAUSE_PROMPT,
  EXPECTED_PROMPT_HASH,
  EXPECTED_CAUSE_PROMPT_HASH,
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
  const hash = pageType === 'cause' ? EXPECTED_CAUSE_PROMPT_HASH : EXPECTED_PROMPT_HASH;
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

    const prompt = pageType === 'cause' ? MASTER_CAUSE_PROMPT : MASTER_SYMPTOM_PROMPT;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
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

    const content = finalizeOutput(raw, pageType);

    // Assign locks so the worker can enforce them
    const hash = pageType === 'cause' ? EXPECTED_CAUSE_PROMPT_HASH : EXPECTED_PROMPT_HASH;
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
