import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { generateTwoStagePage } from "../lib/content-engine/generator";
import { normalizeAuthorityJson, validateAuthorityJson } from "../lib/finalizeAuthoritySymptomJson";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const slug = process.argv[2] || "diagnose/ac-not-cooling";
  const pageType = "symptom";
  console.log(`🚀 Step 1 — Generate test on ${slug}`);

  try {
    const raw = await generateTwoStagePage(slug, {
      slug,
      system: "HVAC",
      coreOnly: false
    }) as any;

    const normalized = normalizeAuthorityJson(raw);
    validateAuthorityJson(normalized, pageType);

    await sql`
      UPDATE pages
      SET 
        content_json = ${JSON.stringify(normalized) as any},
        status = 'generated',
        updated_at = NOW()
      WHERE slug = ${slug}
    `;

    console.log("✅ Success! Page is updated and fully verified.");
  } catch (err) {
    console.error("❌ FAILED:", err);
  }
}

main();
