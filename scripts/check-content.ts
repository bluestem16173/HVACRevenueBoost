import sql from "../lib/db";

async function run() {
  const res = await sql`SELECT slug, content_json FROM pages WHERE slug = 'cape-coral-ac-not-cooling'`;
  if (res.length > 0) {
    if (res[0].content_json && res[0].content_json.problem_summary) {
      console.log(`✅ cape-coral exists + payload: ${res[0].content_json.problem_summary.substring(0, 50)}...`);
    } else {
      console.log(`❌ cape-coral exists but INVALID payload:`, Object.keys(res[0].content_json || {}));
    }
  } else {
    console.log(`❌ cape-coral NOT FOUND in DB!`);
  }
  process.exit(0);
}
run();
