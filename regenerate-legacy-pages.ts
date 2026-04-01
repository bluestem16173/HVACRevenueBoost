import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Preparing to queue older legacy pages for regeneration...");
  
  // Find all pages that don't have the new JSON object 'decision_tree' mapping
  // We can just set their status to "pending" to let the worker re-run them
  const result = await sql`
    UPDATE pages 
    SET status = 'draft'
    WHERE status NOT IN ('draft', 'pending')
    AND page_type = 'symptom'
    AND NOT (content_json ? 'decision_tree')
    RETURNING slug;
  `;
  
  console.log(`Queued ${result.length} legacy pages for regeneration:`);
  console.log(result.map(r => r.slug).join(", ") || "None found!");
  console.log("Run the generation worker to process these pages.");
}

main().catch(console.error);
