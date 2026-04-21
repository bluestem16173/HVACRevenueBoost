/**
 * Batch-regenerate electrical localized pages (Lee County + FM/Cape/Estero grid — unified + electrical annex).
 *
 *   GENERATION_ENABLED=true npx tsx scripts/regenerate-electrical-lee-queue.ts
 *   GENERATION_ENABLED=true npx tsx scripts/regenerate-electrical-lee-queue.ts 10   # resume from 1-based job #10
 *   GENERATION_ENABLED=true npx tsx scripts/regenerate-electrical-lee-queue.ts 20 --skip=electrical/foo/bar-fl   # optional skips
 *
 * Each job shells to `scripts/regenerate-one.ts` (same code path as manual runs).
 * Requires: DATABASE_URL, OPENAI_API_KEY, `.env.local`, GENERATION_ENABLED=true
 */
import { spawnSync } from "node:child_process";

/** Slugs only (no leading slash) — order matches ops SQL export. */
const SLUGS = [
  "electrical/lights-flickering/lehigh-acres-fl",
  "electrical/power-out-in-one-room/lehigh-acres-fl",
  "electrical/burning-smell-from-electrical/lehigh-acres-fl",
  "electrical/breaker-keeps-tripping/bonita-springs-fl",
  "electrical/lights-flickering/bonita-springs-fl",
  "electrical/power-out-in-one-room/bonita-springs-fl",
  "electrical/burning-smell-from-electrical/bonita-springs-fl",
  "electrical/breaker-keeps-tripping/north-fort-myers-fl",
  "electrical/outlet-not-working/north-fort-myers-fl",
  "electrical/lights-flickering/north-fort-myers-fl",
  "electrical/power-out-in-one-room/north-fort-myers-fl",
  "electrical/burning-smell-from-electrical/north-fort-myers-fl",
  "electrical/lights-flickering/fort-myers-beach-fl",
  "electrical/burning-smell-from-electrical/fort-myers-beach-fl",
  "electrical/breaker-keeps-tripping/san-carlos-park-fl",
  "electrical/outlet-not-working/san-carlos-park-fl",
  "electrical/lights-flickering/san-carlos-park-fl",
  "electrical/power-out-in-one-room/san-carlos-park-fl",
  "electrical/burning-smell-from-electrical/san-carlos-park-fl",
  "electrical/lights-flickering/gateway-fl",
  "electrical/burning-smell-from-electrical/gateway-fl",
  "electrical/breaker-keeps-tripping/alva-fl",
  "electrical/outlet-not-working/alva-fl",
  "electrical/lights-flickering/alva-fl",
  "electrical/power-out-in-one-room/alva-fl",
  "electrical/burning-smell-from-electrical/alva-fl",
  "electrical/outlet-sparking/fort-myers-fl",
  "electrical/outlet-sparking/cape-coral-fl",
  "electrical/outlet-sparking/estero-fl",
  "electrical/light-switch-not-working/fort-myers-fl",
  "electrical/light-switch-not-working/cape-coral-fl",
  "electrical/light-switch-not-working/estero-fl",
  "electrical/dead-outlet/fort-myers-fl",
  "electrical/dead-outlet/cape-coral-fl",
  "electrical/dead-outlet/estero-fl",
  "electrical/breaker-keeps-tripping/estero-fl",
  "electrical/panel-overheating/fort-myers-fl",
  "electrical/panel-overheating/cape-coral-fl",
  "electrical/panel-overheating/estero-fl",
  "electrical/circuit-overloaded/fort-myers-fl",
  "electrical/circuit-overloaded/cape-coral-fl",
  "electrical/circuit-overloaded/estero-fl",
  "electrical/breaker-wont-reset/fort-myers-fl",
  "electrical/breaker-wont-reset/cape-coral-fl",
  "electrical/breaker-wont-reset/estero-fl",
  "electrical/buzzing-sound-in-walls/fort-myers-fl",
  "electrical/buzzing-sound-in-walls/cape-coral-fl",
  "electrical/buzzing-sound-in-walls/estero-fl",
  "electrical/exposed-wiring/fort-myers-fl",
  "electrical/exposed-wiring/cape-coral-fl",
  "electrical/exposed-wiring/estero-fl",
  "electrical/faulty-wiring/fort-myers-fl",
  "electrical/faulty-wiring/cape-coral-fl",
  "electrical/faulty-wiring/estero-fl",
  "electrical/power-out-in-one-room/fort-myers-fl",
  "electrical/power-out-in-one-room/cape-coral-fl",
  "electrical/power-out-in-one-room/estero-fl",
  "electrical/partial-power-loss/fort-myers-fl",
  "electrical/partial-power-loss/cape-coral-fl",
  "electrical/partial-power-loss/estero-fl",
  "electrical/whole-house-power-out/fort-myers-fl",
  "electrical/whole-house-power-out/cape-coral-fl",
  "electrical/whole-house-power-out/estero-fl",
  "electrical/lights-flickering/fort-myers-fl",
  "electrical/lights-flickering/cape-coral-fl",
  "electrical/lights-flickering/estero-fl",
  "electrical/outlet-not-working/estero-fl",
] as const;

function normalizeSlugArg(s: string): string {
  return s.replace(/^\/+/, "").trim().toLowerCase();
}

/** First numeric argv = 1-based start job; any `--skip=vertical/...` = slug to omit (no model call). */
function parseArgs(): { start1: number; skip: Set<string> } {
  const skip = new Set<string>();
  let start1 = 1;
  for (const raw of process.argv.slice(2)) {
    const arg = raw.trim();
    if (!arg) continue;
    if (arg.startsWith("--skip=")) {
      skip.add(normalizeSlugArg(arg.slice("--skip=".length)));
      continue;
    }
    if (/^\d+$/.test(arg)) {
      const n = parseInt(arg, 10);
      if (n < 1) {
        console.error("❌ Start job must be ≥ 1 (1-based index in the queue).");
        process.exit(1);
      }
      start1 = Math.min(n, SLUGS.length);
    }
  }
  return { start1, skip };
}

function main() {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.error("❌ Set GENERATION_ENABLED=true to call the model.");
    process.exit(1);
  }

  const total = SLUGS.length;
  const { start1, skip } = parseArgs();
  const start0 = start1 - 1;
  const remaining = total - start0;
  if (skip.size) {
    console.log(`\n⏭ Slugs skipped by flag: ${[...skip].join(", ")}\n`);
  }
  if (start0 > 0) {
    console.log(`\n▶ Resuming: jobs ${start1}–${total} (${remaining} slug(s), skipped 1–${start0}).\n`);
  }

  let ran = 0;
  let skipped = 0;
  for (let i = start0; i < total; i++) {
    const slug = SLUGS[i]!;
    if (skip.has(slug.toLowerCase())) {
      console.log(`\n⏭ [${i + 1}/${total}] Skipped (--skip): ${slug}\n`);
      skipped++;
      continue;
    }
    ran++;
    console.log(`\n━━━ [${i + 1}/${total}] ${slug} ━━━\n`);
    const r = spawnSync("npx", ["tsx", "scripts/regenerate-one.ts", slug], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    if (r.status !== 0) {
      console.error(`❌ Failed (${r.status}): ${slug}`);
      console.error(`   Re-run with: npx tsx scripts/regenerate-electrical-lee-queue.ts ${i + 1}`);
      process.exit(r.status ?? 1);
    }
  }
  const tail = skipped ? ` (${ran} regenerated, ${skipped} skipped by --skip)` : "";
  if (start0 > 0) {
    console.log(`\n✅ Done this run: jobs ${start1}–${total}${tail}.`);
  } else {
    console.log(`\n✅ Done: ${ran} slug(s)${tail}.`);
  }
}

main();
