import * as dotenv from "dotenv";
dotenv.config();
import sql from "../lib/db";

async function main() {
  await sql`ALTER TABLE ai_usage RENAME COLUMN cost TO cost_usd;`;
  await sql`ALTER TABLE ai_usage RENAME COLUMN model TO model_name;`;
  await sql`ALTER TABLE ai_usage ADD COLUMN source varchar;`;
  await sql`ALTER TABLE ai_usage ADD COLUMN prompt_tokens integer;`;
  await sql`ALTER TABLE ai_usage ADD COLUMN completion_tokens integer;`;
  console.log("ai_usage schema fixed!");
}

main().catch(console.dir);
