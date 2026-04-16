/**
 * Step 7 — batch-style sanity check for `validateHsdCityPublishGate` (no DB, no OpenAI).
 */
import { validateHsdCityPublishGate } from "@/lib/homeservice/validateHsdCityPublishGate";

const good = {
  title: "AC Not Cooling in Tampa",
  slug: "hvac/ac-not-cooling/tampa-fl",
  summary_30s: "If airflow is fine at registers but supply air stays warm, you are in capacity or refrigeration control territory.",
  how_system_starts: {
    section_title: "How Your AC System Starts (And Why It Fails)",
    eyebrow: "Technical briefing",
    authority_line:
      "AC systems don't fail randomly — they fail in predictable ways based on load, electrical stress, and component wear.",
    startup_sequence: [
      { title: "Thermostat calls for cooling", detail: "Low-voltage signal leaves the stat when indoor temp is above setpoint." },
      { title: "Contactor pulls in", detail: "Control closes the high-voltage path to the outdoor unit." },
      { title: "Capacitor assists start", detail: "Start/run assist helps compressor and fan motor come up to speed." },
      { title: "Compressor + fan run", detail: "Refrigerant circulates; outdoor fan rejects heat." },
    ],
    environment_title: "Why failures happen faster in Tampa",
    environment_bullets: [
      "Capacitors age faster when case temps stay high.",
      "Peak demand can show marginal voltage / weak contacts.",
      "High latent load keeps run times long.",
    ],
    mapping_title: "What this means for your issue",
    symptom_mapping: [
      { cue: "No indoor response", points_to: "Thermostat power / low-voltage path" },
      { cue: "Clicking but no start", points_to: "Capacitor or contactor" },
      { cue: "Outdoor silent", points_to: "Disconnect, breaker, or compressor circuit" },
    ],
  },
  quick_decision_tree: [
    {
      situation: "Strong airflow but warm supply",
      leads_to: "Refrigerant or metering",
      anchor: "qdt-warm-supply",
      section_ids: ["section-likely-causes", "section-diagnostic-steps"],
    },
    {
      situation: "Weak airflow at vents",
      leads_to: "Filter, blower, or duct restriction",
      anchor: "qdt-weak-airflow",
      section_ids: ["section-quick-checks", "section-likely-causes"],
    },
    {
      situation: "Outdoor fan not spinning",
      leads_to: "Capacitor, motor, or control",
      anchor: "qdt-outdoor-fan",
      section_ids: ["section-diagnostic-steps", "section-repair-vs-pro"],
    },
  ],
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

const badHowSystemStarts = { ...good, how_system_starts: {} };

function run() {
  const g = validateHsdCityPublishGate(good);
  const b = validateHsdCityPublishGate(badMissingSteps);
  const h = validateHsdCityPublishGate(badHowSystemStarts);
  if (!g.ok) {
    console.error("FAIL: good payload should pass", g);
    process.exit(1);
  }
  if (b.ok) {
    console.error("FAIL: bad payload should fail");
    process.exit(1);
  }
  if (h.ok) {
    console.error("FAIL: invalid how_system_starts should fail");
    process.exit(1);
  }
  console.log("✅ publish gate: good → pass; truncated diagnostic_steps → fail");
  console.log("   errors (expected):", b.errors.join(" | "));
  console.log("✅ publish gate: empty how_system_starts → fail");
  console.log("   errors (expected):", h.errors.join(" | "));
}

run();
