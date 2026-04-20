import "dotenv/config";
import sql from "../lib/db";
import {
  enforceHsdOrchestrator,
  generateDiagnosticEngineJson,
} from "../lib/content-engine/generator";
async function generateUpdatedContent(slug: string, title: string): Promise<string> {
  const lastError = "";
  const rawDgMsg = await generateDiagnosticEngineJson(
    { symptom: slug, city: "Florida", pageType: "diagnostic_engine" },
    lastError,
    enforceHsdOrchestrator(null),
  );

  const transformed = rawDgMsg;

    // 3. Instead of returning raw HTML strings, returning stringified JSON
    // for our Next.js frontend to render via buildHtml fallback.
    return JSON.stringify(transformed);
}

export async function runRegenBatch(limit = 5) {
  const pages = await sql`
    SELECT id, slug, title
    FROM pages
    WHERE quality_status = 'needs_regen'
    LIMIT ${limit}
  ` as { id: number, slug: string, title: string }[];

  for (const page of pages) {
    try {
      console.log('Regenerating:', page.slug);

      // 👉 CALL YOUR AI PROMPT HERE
      const newHtmlStr = await generateUpdatedContent(page.slug, page.title);

      if (!newHtmlStr || newHtmlStr.length < 1000) {
        console.log('Failed content:', page.slug);
        continue;
      }

      await sql`
        UPDATE pages
        SET content_json = ${newHtmlStr}::jsonb,
            quality_status = 'approved',
            updated_at = NOW()
        WHERE id = ${page.id}
      `;

      console.log('Updated:', page.slug);

    } catch (err) {
      console.error('Error:', page.slug, err);

      await sql`
        UPDATE pages
        SET quality_status = 'needs_regen'
        WHERE id = ${page.id}
      `;
    }
  }
}

// Allow running standalone from CLI
if (require.main === module) {
    runRegenBatch().then(() => {
        console.log("🏁 Regen batch complete.");
        process.exit(0);
    }).catch(err => {
        console.error("Fatal:", err);
        process.exit(1);
    });
}
