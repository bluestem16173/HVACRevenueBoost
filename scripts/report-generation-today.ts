/**
 * UTC "today": pages touched in `pages`, plus `ai_usage` with tokens and estimated cost.
 *
 * HSD city pages log `ai_usage.source` as `generate-hsd-page:{storageSlug}:attempt-{n}`
 * (see `generateHsdPage.ts` — each retry increments `n` so hidden LLM cost is visible).
 * Older rows: `generate-hsd-page:{slug}` without `:attempt-`, or bare `generate-hsd-page`.
 *
 * Also prints **TOP EXPENSIVE PAGES TODAY** (by attributed USD, then tokens) and **RETRY DETECTED**
 * (slugs with more than one LLM completion today).
 *
 *   npx tsx scripts/report-generation-today.ts
 */
import path from "node:path";

import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import sql from "../lib/db";
import { SITE_ORIGIN } from "../lib/seo/canonical";
import { enforceStoredSlug } from "../lib/slug-utils";

function urlPathFromDbSlug(slug: string): string {
  const s = enforceStoredSlug(slug);
  return s ? `/${s}` : "/";
}

/** Parse `ai_usage.source` for HSD city LLM calls (with or without `:attempt-n`). */
function parseHsdAiUsageSource(source: string): { slug: string; attempt: number } | null {
  if (!source || source === "generate-hsd-page") return null;
  const withAttempt = source.match(/^generate-hsd-page:(.+):attempt-(\d+)$/);
  if (withAttempt) {
    return { slug: enforceStoredSlug(withAttempt[1]!), attempt: parseInt(withAttempt[2]!, 10) };
  }
  const slugOnly = source.match(/^generate-hsd-page:(.+)$/);
  if (slugOnly) return { slug: enforceStoredSlug(slugOnly[1]!), attempt: 1 };
  return null;
}

type UsageAgg = {
  ref_slug: string;
  calls: number;
  max_attempt: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
};

type PageRow = { slug: string; updated_at: string | null; created_at: string | null };

type OtherSource = { source: string; calls: number; total_tokens: number; cost_usd: number };

const TOP_EXPENSIVE_N = 25;
const RULE = "--------------------------------";

function fmtTokens(n: number): string {
  return Number(n).toLocaleString("en-US");
}

function fmtUsd(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 6,
  }).format(usd);
}

async function main() {
  const pages = (await sql`
    SELECT slug, updated_at::text, created_at::text
    FROM public.pages
    WHERE (timezone('utc', COALESCE(updated_at, created_at)))::date = (timezone('utc', now()))::date
    ORDER BY slug
  `) as PageRow[];

  const hsdTaggedRows = (await sql`
    SELECT u.source, u.prompt_tokens, u.completion_tokens, u.cost_usd::float AS cost_usd
    FROM public.ai_usage u
    WHERE (timezone('utc', u.created_at))::date = (timezone('utc', now()))::date
      AND u.source LIKE 'generate-hsd-page:%'
    ORDER BY u.source
  `) as Array<{
    source: string;
    prompt_tokens: number | null;
    completion_tokens: number | null;
    cost_usd: number;
  }>;

  const slugAgg = new Map<
    string,
    {
      ref_slug: string;
      calls: number;
      max_attempt: number;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      cost_usd: number;
    }
  >();
  for (const row of hsdTaggedRows) {
    const parsed = parseHsdAiUsageSource(row.source);
    if (!parsed) continue;
    const key = parsed.slug.toLowerCase();
    const pt = row.prompt_tokens ?? 0;
    const ct = row.completion_tokens ?? 0;
    const prev = slugAgg.get(key);
    if (!prev) {
      slugAgg.set(key, {
        ref_slug: parsed.slug,
        calls: 1,
        max_attempt: parsed.attempt,
        prompt_tokens: pt,
        completion_tokens: ct,
        total_tokens: pt + ct,
        cost_usd: row.cost_usd,
      });
    } else {
      prev.calls += 1;
      prev.max_attempt = Math.max(prev.max_attempt, parsed.attempt);
      prev.prompt_tokens += pt;
      prev.completion_tokens += ct;
      prev.total_tokens += pt + ct;
      prev.cost_usd += row.cost_usd;
    }
  }
  const attributedFixed: UsageAgg[] = [...slugAgg.values()]
    .map((v) => ({
      ref_slug: v.ref_slug,
      calls: v.calls,
      max_attempt: v.max_attempt,
      prompt_tokens: v.prompt_tokens,
      completion_tokens: v.completion_tokens,
      total_tokens: v.total_tokens,
      cost_usd: v.cost_usd,
    }))
    .sort((a, b) => a.ref_slug.localeCompare(b.ref_slug));

  const legacyHsd = (await sql`
    SELECT
      COUNT(*)::int AS calls,
      COALESCE(SUM(prompt_tokens), 0)::int AS prompt_tokens,
      COALESCE(SUM(completion_tokens), 0)::int AS completion_tokens,
      COALESCE(SUM(COALESCE(prompt_tokens, 0) + COALESCE(completion_tokens, 0)), 0)::bigint AS total_tokens,
      COALESCE(SUM(cost_usd::float), 0)::float AS cost_usd
    FROM public.ai_usage
    WHERE (timezone('utc', created_at))::date = (timezone('utc', now()))::date
      AND source = 'generate-hsd-page'
  `) as Array<{
    calls: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: bigint;
    cost_usd: number;
  }>;

  const leg = legacyHsd[0];

  const otherSources = (await sql`
    SELECT
      u.source,
      COUNT(*)::int AS calls,
      COALESCE(SUM(COALESCE(u.prompt_tokens, 0) + COALESCE(u.completion_tokens, 0)), 0)::bigint AS total_tokens,
      COALESCE(SUM(u.cost_usd::float), 0)::float AS cost_usd
    FROM public.ai_usage u
    WHERE (timezone('utc', u.created_at))::date = (timezone('utc', now()))::date
      AND NOT (u.source = 'generate-hsd-page' OR u.source LIKE 'generate-hsd-page:%')
    GROUP BY u.source
    ORDER BY cost_usd DESC
  `) as OtherSource[];

  const bySlug = new Map(
    attributedFixed.map((r) => [enforceStoredSlug(r.ref_slug).toLowerCase(), r])
  );

  console.log("=== UTC date:", new Date().toISOString().slice(0, 10), "===");
  console.log("\n--- Pages table (created/updated today, UTC) ---\n");

  for (const p of pages) {
    const pathSeg = urlPathFromDbSlug(p.slug);
    const u = bySlug.get(enforceStoredSlug(p.slug).toLowerCase());
    const tok = u ? String(u.total_tokens) : "—";
    const cost = u ? u.cost_usd.toFixed(6) : "—";
    const calls = u ? String(u.calls) : "—";
    console.log(`${SITE_ORIGIN}${pathSeg}`);
    console.log(`  slug: ${p.slug}`);
    console.log(`  tokens (sum LLM calls): ${tok}  |  est. USD: ${cost}  |  completions: ${calls}`);
    console.log("");
  }

  if (pages.length === 0) {
    console.log("(none)\n");
  }

  console.log("--- HSD city generation (attributed), today UTC ---\n");
  for (const r of attributedFixed) {
    const pathSeg = urlPathFromDbSlug(r.ref_slug);
    const avg = r.calls > 0 ? Math.round(Number(r.total_tokens) / r.calls) : 0;
    const retries = r.calls > 1 || r.max_attempt > 1 ? `  |  max attempt: ${r.max_attempt}  |  retries (LLM calls − 1): ${Math.max(0, r.calls - 1)}` : "";
    console.log(`${SITE_ORIGIN}${pathSeg}`);
    console.log(
      `  completions: ${r.calls}  |  prompt: ${r.prompt_tokens}  |  completion: ${r.completion_tokens}  |  total tokens: ${r.total_tokens}  |  avg tokens / completion: ${avg}  |  est. USD: ${r.cost_usd.toFixed(6)}${retries}`
    );
    console.log("");
  }
  if (attributedFixed.length === 0) {
    console.log("(none — no `generate-hsd-page:...` rows for today, or only bare `generate-hsd-page`)\n");
  }

  const topExpensive = [...attributedFixed]
    .sort((a, b) => {
      if (b.cost_usd !== a.cost_usd) return b.cost_usd - a.cost_usd;
      return Number(b.total_tokens) - Number(a.total_tokens);
    })
    .slice(0, TOP_EXPENSIVE_N);

  const retryDetected = [...attributedFixed]
    .filter((r) => r.calls > 1 || r.max_attempt > 1)
    .sort((a, b) => {
      if (b.calls !== a.calls) return b.calls - a.calls;
      return b.max_attempt - a.max_attempt;
    });

  console.log("TOP EXPENSIVE PAGES TODAY");
  console.log(RULE);
  if (topExpensive.length === 0) {
    console.log("(no attributed HSD slug rows for today — cannot rank)\n");
  } else {
    for (const r of topExpensive) {
      const pathSeg = urlPathFromDbSlug(r.ref_slug);
      console.log(`${pathSeg} → ${fmtTokens(Number(r.total_tokens))} tokens → ${fmtUsd(r.cost_usd)}`);
    }
    console.log("");
  }

  console.log("RETRY DETECTED");
  console.log(RULE);
  if (retryDetected.length === 0) {
    console.log("(no multi-completion HSD runs for today)\n");
  } else {
    for (const r of retryDetected) {
      const pathSeg = urlPathFromDbSlug(r.ref_slug);
      const attempts = r.calls;
      const hint = r.max_attempt > r.calls ? ` (max attempt index ${r.max_attempt})` : "";
      console.log(`${pathSeg} → ${attempts} attempts${hint}`);
    }
    console.log("");
  }

  if (hsdTaggedRows.length > 0) {
    console.log("--- Each HSD completion row (source = slug + attempt), today UTC ---\n");
    for (const row of hsdTaggedRows) {
      const pt = row.prompt_tokens ?? 0;
      const ct = row.completion_tokens ?? 0;
      console.log(
        `${row.source}  |  tokens: ${pt + ct}  (in ${pt} / out ${ct})  |  est. USD: ${Number(row.cost_usd).toFixed(6)}`
      );
    }
    console.log("");
  }

  if (leg && leg.calls > 0) {
    console.log("--- Legacy `generate-hsd-page` (no slug on source), today UTC ---\n");
    console.log(
      `  completions: ${leg.calls}  |  total tokens: ${leg.total_tokens}  |  est. USD: ${leg.cost_usd.toFixed(6)}`
    );
    console.log("(split across pages — run worker again after deploy for per-page attribution)\n");
  }

  console.log("--- Other AI sources today (UTC) ---\n");
  for (const o of otherSources) {
    console.log(
      `${o.source ?? "(null)"}  |  calls: ${o.calls}  |  tokens: ${o.total_tokens}  |  est. USD: ${o.cost_usd.toFixed(6)}`
    );
  }

  const sumPages = pages.length;
  const sumAttrCost = attributedFixed.reduce((a, r) => a + r.cost_usd, 0);
  const sumAttrTok = attributedFixed.reduce((a, r) => a + Number(r.total_tokens), 0);
  const sumLeg = leg && leg.calls > 0 ? Number(leg.total_tokens) : 0;
  const sumLegCost = leg && leg.calls > 0 ? leg.cost_usd : 0;
  console.log("\n=== Summary (attributed HSD + legacy HSD rows only) ===");
  console.log(`Pages touched today: ${sumPages}`);
  console.log(
    `Attributed HSD completions: ${attributedFixed.reduce((a, r) => a + r.calls, 0)}  |  tokens: ${sumAttrTok}  |  est. USD: ${sumAttrCost.toFixed(6)}`
  );
  if (leg && leg.calls > 0) {
    console.log(`Legacy HSD tokens (unattributed): ${sumLeg}  |  est. USD: ${sumLegCost.toFixed(6)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
