import sql from "../lib/db";

async function check() {
  const r = await sql`
    SELECT attempts, regeneration_attempts 
    FROM generation_queue 
    WHERE status IN ('draft', 'pending') 
    LIMIT 5
  `;
  console.log(r);

  // If there are attempts >= 2 blocking generation, let's fix it right here:
  await sql`
    UPDATE generation_queue 
    SET attempts = 0, regeneration_attempts = 0 
    WHERE status IN ('draft', 'pending')
  `;
  console.log("Reset all attempts for pending items!");
  process.exit(0);
}

check();
