import OpenAI from "openai";
import { validateSeoLinks } from "./validateSeoLinks";
import { SeoLinks } from "./types";

const openai = new OpenAI();
  
import { MASTER_GOLD_STANDARD_PROMPT } from "@/lib/content-engine/core";

const MEGA_SEO_PROMPT = MASTER_GOLD_STANDARD_PROMPT;

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
