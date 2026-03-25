import { runWorker } from "./generation-worker";

async function force() {
  console.log("Forcing worker to process 10 system pages...");
  const res = await runWorker({ limit: 10, manual: true, type: 'system' });
  console.log("Worker Result:", res);
  process.exit(0);
}

force().catch(console.error);
