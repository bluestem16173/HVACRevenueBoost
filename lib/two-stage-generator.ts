import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import crypto from "crypto";
import { z } from "zod";

const Schema = z.object({
  title: z.string(),
  intro: z.string(),
  urgencyLevel: z.enum(["low", "medium", "high"]),
  systemExplanation: z.array(z.string()),
  decision_tree: z.string().min(10),
  diagnosticFlow: z.array(z.any()).min(3),
  likelyIssues: z.array(z.any()).min(1),
  quickChecks: z.array(z.string()),
  repairOptions: z.array(z.any()),
  leadSignals: z.object({
    callNow: z.boolean(),
    reason: z.string()
  }),
  primaryCTA: z.object({
    headline: z.string(),
    subtext: z.string(),
    buttonText: z.string(),
    url: z.string()
  }),
  seo: z.object({
    metaTitle: z.string(),
    metaDescription: z.string()
  }).optional()
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function safeJsonParse<T>(str: string): T | null {
  try { return JSON.parse(str) as T; } catch { return null; }
}

function isJsonTruncated(str: string): boolean {
  return !str.trim().endsWith("}");
}

export const MASTER_SYSTEM_PROMPT = `🎯 PURPOSE
Convert users into leads
Route to HVAC contractors
Support residential + commercial

🚨 SYSTEM INSTRUCTION (STRICT)
You are an expert HVAC technician and lead-generation content system.

You MUST return ONLY valid JSON.
DO NOT include markdown.
DO NOT include explanations.
DO NOT wrap output in quotes.

Your output MUST match the schema exactly.

You are writing for homeowners or business owners with HVAC problems.

Your goals:
- Quickly diagnose the issue
- Help users understand urgency
- Identify when professional service is needed
- Encourage lead conversion for HVAC services

If you cannot comply, return {}.

📦 SCHEMA (HVAC)
{
  "title": "string",
  "intro": "string",
  "urgencyLevel": "low | medium | high",
  "systemExplanation": ["string"],
  "decision_tree": "string",
  "diagnosticFlow": [
    {
      "step": 0,
      "question": "string",
      "yes": "string",
      "no": "string",
      "next_step": 0
    }
  ],
  "likelyIssues": [
    {
      "issue": "string",
      "severity": "low | medium | high",
      "requiresPro": true,
      "description": "string"
    }
  ],
  "quickChecks": ["string"],
  "repairOptions": [
    {
      "option": "string",
      "type": "DIY | professional",
      "estimatedCost": "string",
      "time": "string",
      "description": "string"
    }
  ],
  "leadSignals": {
    "callNow": true,
    "reason": "string"
  },
  "primaryCTA": {
    "headline": "string",
    "subtext": "string",
    "buttonText": "string",
    "url": "{{GHL_CTA_URL}}"
  },
  "seo": {
    "metaTitle": "string",
    "metaDescription": "string"
  }
}

⚙️ GENERATION INSTRUCTION
Generate an HVAC diagnostic and lead-conversion guide for:

ISSUE: "{ISSUE}"
PROPERTY_TYPE: "{residential | commercial}"

Requirements:

1. urgencyLevel:
- high if system failure, safety risk, or no cooling/heating

2. systemExplanation:
- simple explanation of system operation

3. decision_tree:
- MUST be Mermaid graph TD
- Focus on quick narrowing

4. diagnosticFlow:
- Clear steps user can follow immediately

5. likelyIssues:
- Focus on real-world service problems
- Flag if requires professional

6. quickChecks:
- Things user can try in 5–10 minutes

7. repairOptions:
- Split between DIY vs professional
- Include realistic pricing ranges

8. leadSignals:
- Set callNow = true if:
  - high severity
  - refrigerant issues
  - electrical issues
  - compressor failure

9. Tone:
- Slight urgency
- Clear guidance
- Encourage action when needed

CRITICAL UI REQUIREMENT — ABOVE-THE-FOLD CTA:
You MUST include a primary Call-To-Action (primaryCTA) section positioned ABOVE THE FOLD.
- Headline: Solve the user's problem immediately (symptom-focused).
- Subtext: Reinforce speed, clarity, or cost savings.
- Button Text: Action-oriented (e.g., "Get Instant Diagnosis", "Fix This Now", "Check Your System").
- Link: MUST EXACTLY be "{{GHL_CTA_URL}}". Do NOT hardcode URLs.

🔒 VALIDATION BLOCK
Before returning:
- decision_tree must not be empty
- diagnosticFlow must have at least 3 steps
- At least one issue must require professional service
- primaryCTA must be present and url MUST be "{{GHL_CTA_URL}}"

If not, regenerate internally.`;

// Secure hash lock
export const EXPECTED_PROMPT_HASH = crypto.createHash('sha256').update(MASTER_SYSTEM_PROMPT).digest('hex');

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
  throw lastError;
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
- PRIMARY_KEYWORD: ${keyword || problem}`;

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
    if (!raw) throw new Error("Generation API: empty response");

    if (isJsonTruncated(raw)) {
      throw new Error("Generation API: output truncated (missing closing brace)");
    }

    // Strip markdown if it somehow bypassed the instruction
    const cleaned = raw.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim();

    const parsed = safeJsonParse<any>(cleaned);
    if (!parsed) {
      console.error("Bad JSON from AI:", cleaned);
      throw new Error("Generation API: unrecoverable JSON payload");
    }

    // Enforce Schema Validation (BLOCK BAD WRITES)
    const zodValidation = Schema.safeParse(parsed);
    if (!zodValidation.success) {
      console.error("ZOD VALIDATION ERROR:", zodValidation.error.format());
      throw new Error("❌ INVALID AI OUTPUT - BLOCKED");
    }

    // Assign locks so the worker can enforce them
    parsed._prompt_hash = EXPECTED_PROMPT_HASH;
    
    // Ensure critical fields default gracefully
    if (slug && !parsed.slug) parsed.slug = slug;

    return parsed;
  });
}
