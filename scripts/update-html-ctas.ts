import sql from "../lib/db";

async function run() {
  console.log("Updating content_html CTAs...");
  const res = await sql`
    UPDATE pages
    SET content_html = regexp_replace(
      content_html,
      'openModal',
      'openLeadCard',
      'g'
    )
    WHERE content_html IS NOT NULL
  `;
  console.log(`Updated successfully.`);
  process.exit(0);
}

run().catch(console.error);
