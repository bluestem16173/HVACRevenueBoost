import OpenAI from "openai";
import sql from "../lib/db";
import { contentToHtml } from "../lib/contentToHtml";

import { composePromptForPageType, validateSymptomPage } from "../lib/prompt-schema-router";

const openai = new OpenAI();
const slug = "ac-not-cooling";

async function run() {
  console.log("Generating payload for ac-not-cooling...");
  
  const msg = composePromptForPageType("symptom", slug);
  console.log("FINAL PROMPT:", msg.slice(0, 1000));
  

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "user", content: msg }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3
  });

  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("No output");
  
  const data = JSON.parse(content);
  
  console.log({
    title: data.title,
    intro: data.intro ? true : false,
    symptom_description: data.symptom_description ? true : false,
    causes_count: data.possible_causes?.length
  });

  validateSymptomPage(data);

  console.log("Got data top-level keys:", Object.keys(data));

  const seoLinks = data.seo_links;
  console.log("Got seo_links structured as:", Object.keys(seoLinks || {}));

  const html = contentToHtml(data);

  const dbSlug = `diagnose/${slug}`;
  // Save to DB mimicking production
  await sql`
    INSERT INTO pages (slug, title, page_type, content_json, content_html, status, quality_score, updated_at)
    VALUES (${dbSlug}, ${data.title || slug}, 'symptom', ${data}, ${html}, 'published', 100, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      content_json = EXCLUDED.content_json,
      content_html = EXCLUDED.content_html,
      status = 'published',
      quality_score = 100,
      updated_at = NOW()
  `;

  console.log("✅ Success! Run 'npm run dev' and visit http://localhost:3000/diagnose/ac-not-cooling to view");
  process.exit(0);
}

run().catch(console.error);
