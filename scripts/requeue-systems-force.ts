import "dotenv/config";
import sql from "../lib/db";

async function run() {
  const top10Systems = [
    "central-air-conditioning-system",
    "furnace-system",
    "heat-pump-system",
    "ductless-mini-split-system",
    "thermostat-control-system",
    "air-handler-system",
    "packaged-hvac-unit",
    "boiler-heating-system",
    "geothermal-heat-pump",
    "ventilation-ductwork-system"
  ];

  console.log(`Force-injecting ${top10Systems.length} systems to draft...`);
  
  for (const slug of top10Systems) {
    const res = await sql`
      UPDATE generation_queue 
      SET status = 'draft', page_type = 'system'
      WHERE proposed_slug = ${slug}
      RETURNING id
    `;
    
    if (res.length === 0) {
      await sql`
        INSERT INTO generation_queue (proposed_slug, page_type, status)
        VALUES (${slug}, 'system', 'draft')
      `;
    }
  }
  
  console.log("✅ Done forcing systems to draft.");
  process.exit(0);
}

run().catch(console.error);
