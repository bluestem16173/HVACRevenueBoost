import { runHsdPipeline } from "@/lib/homeservice/hsdPageQueueWorker";

async function main() {
  const job = {
    slug: "hvac/ac-not-cooling/tampa-fl",
    page_type: "hsd",
  } as any;

  console.log("Running single HSD job:", job.slug);

  await runHsdPipeline(job);

  console.log("✅ DONE");
}

main().catch((err) => {
  console.error("❌ FAILED:", err);
});
