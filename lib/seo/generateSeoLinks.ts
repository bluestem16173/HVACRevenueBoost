import OpenAI from "openai";
import { validateSeoLinks } from "./validateSeoLinks";
import { SeoLinks } from "./types";

const openai = new OpenAI();
  
const MEGA_SEO_PROMPT = `You are an intelligent HVAC SEO linking engine.

GOAL:
Produce comprehensive internal link strategies with contextually perfect anchor texts that EXACTLY MATCH phrases in the provided content.

INPUT SLUG: {SLUG}
PAGE TYPE: {PAGE_TYPE}

CONTENT REFERENCE:
{CONTENT}

CRITICAL RULES:
1. Output JSON only. Match the exact schema provided.
2. Contextual Links MUST use anchors that appear exactly in the CONTENT reference (case-insensitive) so they can be regex replaced. Focus on quick_answer and short explanations.
3. Section Links and Entity Connections anchors should be natural, varied, and 2-5 words.
4. Avoid repeating the exact slug formatting for anchors.
5. Limit to highly relevant targets.
6. Provide fully resolved absolute paths for \`path\` (e.g. \`/diagnose/ac-not-cooling\`, \`/components/capacitor\`).

SCHEMA EXPECTED:
{
  "page_slug": "{SLUG}",
  "page_type": "{PAGE_TYPE}",
  "link_strategy_summary": {
    "primary_cluster_focus": "string",
    "secondary_cluster_focus": "string",
    "total_contextual_links": 2,
    "total_section_links": 5,
    "notes": "string"
  },
  "contextual_links": {
    "quick_answer": [{"slug": "...", "path": "/...", "anchor": "exact-phrase-from-text"}],
    "short_explanation": [],
    "likely_causes": [],
    "diagnostic_steps": [],
    "faq_or_supporting_copy": []
  },
  "section_links": {
    "components_section": [{"slug": "...", "path": "/...", "anchor": "..."}],
    "repairs_section": [],
    "related_problems_section": []
  },
  "entity_connections": {
    "related_symptoms": [],
    "related_causes": [],
    "related_repairs": [],
    "related_components": [],
    "related_guides": []
  },
  "injection_rules": {
    "max_links_per_short_paragraph": 1,
    "max_total_contextual_links": 5,
    "max_total_section_links": 10,
    "avoid_repeating_same_anchor": true,
    "avoid_duplicate_slug_across_sections": true,
    "prefer_high_relevance_near_top": true
  }
}
`;

export async function generateSeoLinks(slug: string, pageType: string, contentJson: any): Promise<SeoLinks> {
  const contentSnapshot = JSON.stringify(contentJson, null, 2);
  const truncatedContent = contentSnapshot.length > 4000 ? contentSnapshot.slice(0, 4000) + "..." : contentSnapshot;

  const systemPrompt = MEGA_SEO_PROMPT
    .replace("{SLUG}", slug)
    .replace("{PAGE_TYPE}", pageType)
    .replace("{CONTENT}", truncatedContent);

  const userMsg = `Generate mega SEO linking schema for slug: ${slug}`;

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

      const parsed = JSON.parse(contentStr);
      return validateSeoLinks(parsed);
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

  return validateSeoLinks({ page_slug: slug, page_type: pageType });
}
