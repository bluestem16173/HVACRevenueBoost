/**
 * Show mock page for ac-blowing-warm-air — generate, save to DB, finalize prior to build
 * Usage: npx tsx scripts/show-mock-page.ts
 */
import "dotenv/config";
import sql from "../lib/db";
import { generatePageContent, renderToHtml } from "../lib/ai-generator";
import { getSymptomWithCausesFromDB, getCauseDetails } from "../lib/diagnostic-engine";
import { SYMPTOMS } from "../data/knowledge-graph";

const SLUG = "ac-blowing-warm-air";

async function main() {
  console.log("🚀 Generating and saving mock page:", SLUG, "\n");
  const symptomSlug = SLUG.replace(/^diagnose\//, "").replace(/^diagnose-/, "");
  const pageTitle = symptomSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const pageSlug = `diagnose/${symptomSlug}`;

  let graphSymptom = await getSymptomWithCausesFromDB(symptomSlug);
  if (!graphSymptom) {
    const staticSymptom = SYMPTOMS.find((s) => s.id === symptomSlug);
    if (staticSymptom?.causes?.length) {
      graphSymptom = {
        id: staticSymptom.id,
        name: staticSymptom.name,
        slug: staticSymptom.id,
        description: staticSymptom.description,
        causes: staticSymptom.causes.map((cId) => getCauseDetails(cId)).filter(Boolean),
      } as any;
    }
  }

  const aiData = await generatePageContent(pageSlug, "symptom", pageTitle, {
    graphSymptom: graphSymptom || undefined,
  });
  const html = renderToHtml(aiData);

  console.log("--- AI DATA (keys) ---");
  console.log(Object.keys(aiData).join(", "));
  console.log("\n--- SUMMARY ---");
  console.log(aiData.summary || aiData.fast_answer || "(none)");
  console.log("\n--- CAUSES ---");
  (aiData.causes || []).slice(0, 3).forEach((c: any, i: number) => {
    console.log(`  ${i + 1}. ${c.name}${c.indicator ? ` — ${c.indicator}` : ""}`);
  });
  console.log("\n--- REPAIRS ---");
  (aiData.repairs || []).slice(0, 5).forEach((r: any, i: number) => {
    console.log(`  ${i + 1}. ${r.name} (${r.difficulty || "?"})`);
  });
  console.log("\n--- HTML LENGTH ---");
  console.log(html?.length || 0, "chars");
  console.log("\n--- HTML PREVIEW (first 1500 chars) ---");
  console.log((html || "").slice(0, 1500));

  const contentJson = {
    ...aiData,
    html_content: html || "",
    generated_at: new Date().toISOString(),
  };

  await sql`
    INSERT INTO pages (slug, title, page_type, status, content_json)
    VALUES (${SLUG}, ${pageTitle}, 'symptom', 'published', ${JSON.stringify(contentJson)})
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      status = EXCLUDED.status,
      content_json = EXCLUDED.content_json
  `;
  console.log("\n✅ Mock page saved to DB. View at http://localhost:3000/diagnose/ac-blowing-warm-air");
}

main().catch(console.error);
