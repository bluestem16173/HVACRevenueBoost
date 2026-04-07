import sql from "../lib/db";
import { runWorker } from "./generation-worker";

async function main() {
  try {
    // 1. Force the row to be queue=draft
    await sql`
      UPDATE generation_queue
      SET status = 'draft', attempts = 0
      WHERE proposed_slug = 'ac-short-cycling'
    `;
    console.log("Queue reset for ac-short-cycling.");

    // 2. Run the worker explicitly for this one job manually.
    console.log("Running worker manually...");
    await runWorker({ manual: true, limit: 1 });

    console.log("Worker finished.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
