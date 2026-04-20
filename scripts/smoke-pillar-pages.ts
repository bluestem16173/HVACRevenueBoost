/**
 * GET smoke test: national pillar paths + HVAC system hubs + trade hubs + request-service (rv profile).
 *
 *   npx tsx scripts/smoke-pillar-pages.ts
 *   npx tsx scripts/smoke-pillar-pages.ts http://localhost:3000
 *   npx tsx scripts/smoke-pillar-pages.ts https://www.hvacrevenueboost.com
 */
const DEFAULT_BASE = "http://localhost:3000";

/**
 * National `/vertical/symptom` paths to assert **200** (must exist in `pages` or static fallbacks).
 * Tier-1 indexable HVAC slugs in `lib/seo/indexable-pillars.ts` also include
 * `high-energy-bills`, `ac-blowing-warm-air`, `ac-running-but-not-cooling` — add them here once published.
 */
const PILLARS: { prefix: string; slugs: readonly string[] }[] = [
  { prefix: "/hvac", slugs: ["ac-not-cooling", "weak-airflow", "no-cold-air"] },
  {
    prefix: "/electrical",
    slugs: ["breaker-keeps-tripping", "outlet-not-working", "power-out-in-one-room"],
  },
  { prefix: "/plumbing", slugs: ["no-hot-water", "drain-clogged", "water-heater-leaking"] },
];

/** Optional pillars: warn on non-200 but do not fail the script (queue / DB may not have built them yet). */
const OPTIONAL_HVAC_PILLARS = ["high-energy-bills", "ac-blowing-warm-air", "ac-running-but-not-cooling"] as const;

/** Short slugs for `/hvac/{segment}` system hubs — see `app/hvac/[symptom]/page.tsx` SLUG_MAP. */
const HVAC_SYSTEM_HUBS = [
  "air-conditioning",
  "heating-systems",
  "airflow-ductwork",
  "electrical-controls",
  "thermostats-controls",
  "maintenance",
] as const;

function normalizeBase(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function requiredUrls(base: string): string[] {
  const b = normalizeBase(base);
  const out: string[] = [`${b}/hvac`, `${b}/plumbing`, `${b}/electrical`];
  for (const h of HVAC_SYSTEM_HUBS) {
    out.push(`${b}/hvac/${h}`);
  }
  for (const { prefix, slugs } of PILLARS) {
    for (const s of slugs) {
      out.push(`${b}${prefix}/${s}`);
    }
  }
  out.push(`${b}/request-service?profile=rv_hvac`);
  return out;
}

function optionalUrls(base: string): string[] {
  const b = normalizeBase(base);
  return OPTIONAL_HVAC_PILLARS.map((s) => `${b}/hvac/${s}`);
}

async function main() {
  const base = process.argv[2]?.trim() || DEFAULT_BASE;
  const required = requiredUrls(base);
  const optional = optionalUrls(base);
  let fail = 0;
  for (const u of required) {
    try {
      const res = await fetch(u, { redirect: "follow" });
      const ok = res.ok;
      if (!ok) fail++;
      console.log(`${ok ? "OK " : "FAIL"} ${res.status} ${u}`);
    } catch (e) {
      fail++;
      console.log(`FAIL — ${u} (${e instanceof Error ? e.message : String(e)})`);
    }
  }
  for (const u of optional) {
    try {
      const res = await fetch(u, { redirect: "follow" });
      const ok = res.ok;
      console.log(`${ok ? "OK " : "SKIP"} ${res.status} ${u}${ok ? "" : " (optional — publish pillar when ready)"}`);
    } catch (e) {
      console.log(
        `SKIP — ${u} (${e instanceof Error ? e.message : String(e)}) (optional — publish pillar when ready)`
      );
    }
  }
  console.log(`\nRequired: ${required.length - fail}/${required.length} OK`);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
