/**
 * Step 7 — batch-style sanity check for `validateHsdCityPublishGate` (no DB, no OpenAI).
 */
import { validateHsdCityPublishGate } from "@/lib/homeservice/validateHsdCityPublishGate";

const good = {
  title: "AC Not Cooling in Tampa",
  slug: "hvac/ac-not-cooling/tampa-fl",
  summary_30s: "If airflow is fine at registers but supply air stays warm, you are in capacity or refrigeration control territory.",
  quick_checks: ["a", "b", "c"],
  likely_causes: ["x", "y", "z"],
  diagnostic_steps: ["1", "2", "3", "4"],
  repair_vs_pro: { diy_ok: ["check filter"], call_pro: ["refrigerant work"] },
  internal_links: {
    parent: "/hvac",
    siblings: ["/a", "/b", "/c"],
    service: "/hvac/ac-repair/tampa-fl",
    authority: "/hvac/how-central-air-conditioning-works",
  },
};

const badMissingSteps = { ...good, diagnostic_steps: ["1", "2"] };

function run() {
  const g = validateHsdCityPublishGate(good);
  const b = validateHsdCityPublishGate(badMissingSteps);
  if (!g.ok) {
    console.error("FAIL: good payload should pass", g);
    process.exit(1);
  }
  if (b.ok) {
    console.error("FAIL: bad payload should fail");
    process.exit(1);
  }
  console.log("✅ publish gate: good → pass; truncated diagnostic_steps → fail");
  console.log("   errors (expected):", b.errors.join(" | "));
}

run();
