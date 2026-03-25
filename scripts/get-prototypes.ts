import * as dotenv from "dotenv";
dotenv.config();
import sql from "../lib/db";

async function main() {
  const types = ["symptom", "diagnostic", "cause", "repair", "component", "condition", "authority", "city"];
  console.log("Generated Prototype URLs:");
  for (const t of types) {
    try {
      const res = await sql`
        SELECT slug FROM pages 
        WHERE page_type = ${t} AND status = 'published' AND quality_status IS NOT NULL AND quality_status != 'needs_regen'
        ORDER BY updated_at DESC LIMIT 1
      `;
      if ((res as any[]).length > 0) {
        console.log(`[${t.toUpperCase()}] http://localhost:3003/${(res as any[])[0].slug}`);
      }
    } catch(e) {}
  }
}
main().catch(console.dir);
