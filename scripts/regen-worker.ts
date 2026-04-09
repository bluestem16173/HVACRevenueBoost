import "dotenv/config";
import sql from '../lib/db';
import { generateDiagnosticEngineJson } from '../lib/content-engine/generator';
import { transformToHVACv3 } from './generation-worker';

async function generateUpdatedContent(slug: string, title: string): Promise<string> {
    // 1. Generate new content via AI using our existing generator
    const lastError = "";
    const rawDgMsg = await generateDiagnosticEngineJson(
        { symptom: slug, city: "Florida", pageType: "hvac_authority_v3" },
        lastError,
        null
    );

    // 2. Transform the payload
    const transformed = transformToHVACv3(rawDgMsg);

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
