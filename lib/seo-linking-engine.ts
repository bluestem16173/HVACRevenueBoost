import OpenAI from "openai";

const openai = new OpenAI();
  
const SEO_LINKING_PROMPT = `You are an HVAC SEO strategist and internal linking expert.

GOAL:
Generate internal linking data and anchor text for a page about: {SLUG}

CRITICAL RULES:
- Output JSON only (no markdown, no explanation)
- Keep anchors natural and human-readable
- Do NOT repeat exact keyword phrasing
- Avoid keyword stuffing
- Use varied phrasing for links
- Keep anchor text 2–6 words max
- Use lowercase slugs for URLs
- Anchors must not exactly match the slug. Use natural phrasing and variation.
- Do not generate duplicate or overlapping links across categories.

TASKS:

1. Generate 3–5 related symptom pages
2. Generate 2–4 related cause pages
3. Generate 2–4 related repair pages
4. Generate 2–3 related components

For EACH item:
- Provide slug
- Provide optimized anchor text

Anchor text should:
- sound natural in a sentence
- not be identical to slug
- vary wording (e.g., "ac not cooling" -> "air conditioner not cooling properly")

OUTPUT FORMAT:

{
  "related_symptoms": [
    {
      "slug": "",
      "anchor": ""
    }
  ],
  "related_causes": [
    {
      "slug": "",
      "anchor": ""
    }
  ],
  "related_repairs": [
    {
      "slug": "",
      "anchor": ""
    }
  ],
  "related_components": [
    {
      "slug": "",
      "anchor": ""
    }
  ]
}`;

export type InternalLink = {
  slug: string;
  anchor: string;
};

export type SeoLinks = {
  related_symptoms: InternalLink[];
  related_causes: InternalLink[];
  related_repairs: InternalLink[];
  related_components: InternalLink[];
};

export async function generateInternalLinks(slug: string): Promise<SeoLinks> {
  const systemPrompt = SEO_LINKING_PROMPT.replace("{SLUG}", slug);
  const userMsg = "Slug parameter: " + slug;

  const MAX_RETRIES = 2;
  let lastError: unknown;

  for (let retryCount = 0; retryCount <= MAX_RETRIES; retryCount++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const contentStr = response.choices[0]?.message?.content;
      if (!contentStr) throw new Error("Empty response from OpenAI");

      const parsed = JSON.parse(contentStr) as SeoLinks;

      // Validate shape loosely
      if (!Array.isArray(parsed.related_symptoms)) parsed.related_symptoms = [];
      if (!Array.isArray(parsed.related_causes)) parsed.related_causes = [];
      if (!Array.isArray(parsed.related_repairs)) parsed.related_repairs = [];
      if (!Array.isArray(parsed.related_components)) parsed.related_components = [];

      return parsed;
    } catch (err: any) {
      lastError = err;
      if (retryCount < MAX_RETRIES) {
        console.warn("⚠️ Retry SEO linking generation:", slug, err?.message || err);
        await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
      } else {
        console.error("❌ Failed SEO linking generation:", slug, err?.message || err);
        throw lastError;
      }
    }
  }

  // Fallback to empty
  return {
    related_symptoms: [],
    related_causes: [],
    related_repairs: [],
    related_components: [],
  };
}
