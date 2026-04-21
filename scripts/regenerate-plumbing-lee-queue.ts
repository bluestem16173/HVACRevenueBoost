/**
 * Lee County plumbing locals — ops queue (uses unified + plumbing annex via `regenerate-one.ts`).
 *
 *   GENERATION_ENABLED=true npx tsx scripts/regenerate-plumbing-lee-queue.ts
 */
import { spawnSync } from "node:child_process";

const SLUGS = [
  "plumbing/water-heater-making-noise/fort-myers-fl",
  "plumbing/water-heater-making-noise/cape-coral-fl",
  "plumbing/water-heater-leaking/lehigh-acres-fl",
  "plumbing/low-water-pressure/lehigh-acres-fl",
  "plumbing/water-heater-making-noise/lehigh-acres-fl",
  "plumbing/drain-clogged/lehigh-acres-fl",
  "plumbing/water-heater-leaking/bonita-springs-fl",
  "plumbing/low-water-pressure/bonita-springs-fl",
  "plumbing/water-heater-making-noise/bonita-springs-fl",
  "plumbing/drain-clogged/bonita-springs-fl",
  "plumbing/water-heater-making-noise/estero-fl",
  "plumbing/water-heater-leaking/north-fort-myers-fl",
  "plumbing/low-water-pressure/north-fort-myers-fl",
  "plumbing/water-heater-making-noise/north-fort-myers-fl",
  "plumbing/drain-clogged/north-fort-myers-fl",
  "plumbing/low-water-pressure/fort-myers-beach-fl",
  "plumbing/water-heater-making-noise/fort-myers-beach-fl",
  "plumbing/water-heater-leaking/san-carlos-park-fl",
  "plumbing/low-water-pressure/san-carlos-park-fl",
  "plumbing/water-heater-making-noise/san-carlos-park-fl",
  "plumbing/drain-clogged/san-carlos-park-fl",
  "plumbing/water-heater-leaking/gateway-fl",
  "plumbing/low-water-pressure/gateway-fl",
  "plumbing/water-heater-making-noise/gateway-fl",
  "plumbing/drain-clogged/gateway-fl",
  "plumbing/water-heater-leaking/alva-fl",
  "plumbing/low-water-pressure/alva-fl",
  "plumbing/water-heater-making-noise/alva-fl",
  "plumbing/drain-clogged/alva-fl",
] as const;

function main() {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.error("❌ Set GENERATION_ENABLED=true to call the model.");
    process.exit(1);
  }

  const total = SLUGS.length;
  for (let i = 0; i < total; i++) {
    const slug = SLUGS[i]!;
    console.log(`\n━━━ [${i + 1}/${total}] ${slug} ━━━\n`);
    const r = spawnSync("npx", ["tsx", "scripts/regenerate-one.ts", slug], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    if (r.status !== 0) {
      console.error(`❌ Failed (${r.status}): ${slug}`);
      process.exit(r.status ?? 1);
    }
  }
  console.log(`\n✅ Done: ${total} slugs.`);
}

main();
