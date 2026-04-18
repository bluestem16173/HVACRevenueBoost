/**
 * Batch-generate dg_authority_v3 page JSON for local QA (not published).
 *
 * Usage:
 *   npx tsx scripts/generateAuthorityBatch.ts --from-demos
 *   npx tsx scripts/generateAuthorityBatch.ts --llm
 *
 * --from-demos: clones existing fixture inputs, overrides slug/title/cluster/trade (no OpenAI).
 * --llm: requires OPENAI_API_KEY; reads prompts/DG_Authority_V3_Generation_Lock.md; validates via buildDgAuthorityV3Page.
 */
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { buildDgAuthorityV3Page } from "../lib/dg/buildDgAuthorityV3Page";
import type { DgAuthorityV3PageInput } from "../lib/dg/typesDgAuthorityV3";
import {
  PLUMBING_WATER_HEATER_TAMPA_V3,
  PLUMBING_NO_HOT_WATER_V3,
  PLUMBING_WATER_HEATER_LEAKING_V3,
  ELECTRICAL_CIRCUIT_OVERLOAD_TAMPA_V3,
  ELECTRICAL_BREAKER_TRIPS_INSTANTLY_V3,
  ELECTRICAL_OUTLET_NOT_WORKING_V3,
} from "../lib/dg-authority-structured-preview/dgAuthorityV3Demos";

type PageSpec = {
  trade: "hvac" | "plumbing" | "electrical";
  slug: string;
  title: string;
  cluster: string;
};

const pagesToGenerate: PageSpec[] = [
  {
    trade: "plumbing",
    slug: "plumbing/water-heater-not-working",
    title: "Water Heater Not Working",
    cluster: "heater",
  },
  {
    trade: "plumbing",
    slug: "plumbing/no-hot-water",
    title: "No Hot Water",
    cluster: "heater",
  },
  {
    trade: "plumbing",
    slug: "plumbing/water-heater-leaking",
    title: "Water Heater Leaking",
    cluster: "tank",
  },
  {
    trade: "electrical",
    slug: "electrical/circuit-overload",
    title: "Circuit Overload",
    cluster: "load",
  },
  {
    trade: "electrical",
    slug: "electrical/breaker-trips-instantly",
    title: "Breaker Trips Instantly",
    cluster: "fault",
  },
  {
    trade: "electrical",
    slug: "electrical/outlet-not-working",
    title: "Outlet Not Working",
    cluster: "wiring",
  },
];

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function applyPageMeta(base: DgAuthorityV3PageInput, page: PageSpec): DgAuthorityV3PageInput {
  const out = deepClone(base);
  delete (out as { location?: string }).location;
  out.title = page.title;
  out.slug = page.slug;
  out.trade = page.trade;
  out.cluster = page.cluster;
  out.diagnostic_mermaid_cluster = page.cluster;
  return out;
}

/** Map each batch row to a differentiated fixture (same dg_authority_v3 shape, distinct intent/copy). */
function inputFromDemos(page: PageSpec): DgAuthorityV3PageInput {
  if (page.trade === "plumbing") {
    if (page.slug === "plumbing/no-hot-water") {
      return applyPageMeta(PLUMBING_NO_HOT_WATER_V3, page);
    }
    if (page.slug === "plumbing/water-heater-leaking") {
      return applyPageMeta(PLUMBING_WATER_HEATER_LEAKING_V3, page);
    }
    return applyPageMeta(PLUMBING_WATER_HEATER_TAMPA_V3, page);
  }
  if (page.slug === "electrical/breaker-trips-instantly") {
    return applyPageMeta(ELECTRICAL_BREAKER_TRIPS_INSTANTLY_V3, page);
  }
  if (page.slug === "electrical/outlet-not-working") {
    return applyPageMeta(ELECTRICAL_OUTLET_NOT_WORKING_V3, page);
  }
  return applyPageMeta(ELECTRICAL_CIRCUIT_OVERLOAD_TAMPA_V3, page);
}

function stripJsonFence(raw: string): string {
  return raw.replace(/^\s*```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

function loadLockPrompt(): string {
  const p = path.join(process.cwd(), "prompts", "DG_Authority_V3_Generation_Lock.md");
  return fs.readFileSync(p, "utf8");
}

function templateKeyForTrade(t: PageSpec["trade"]): string {
  if (t === "plumbing") return "plumbing_v1";
  if (t === "electrical") return "electrical_v1";
  return "hvac_v1";
}

/**
 * Calls the model; returns {@link DgAuthorityV3PageInput} (no layout/schema — builder stamps those).
 */
async function generateWithLLM(page: PageSpec): Promise<DgAuthorityV3PageInput> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY missing. Use --from-demos for offline QA, or set OPENAI_API_KEY in .env.local for --llm."
    );
  }

  const openai = new OpenAI({ apiKey: key });
  const model = process.env.OPENAI_DG_AUTHORITY_MODEL?.trim() || "gpt-4o-mini";
  const lockDoc = loadLockPrompt();

  const user = `${lockDoc}

---

Generate ONE complete dg_authority_v3 page as JSON for this page (field technician tone, all CRITICAL RULES).

Fixed metadata (use exactly):
- trade: "${page.trade}"
- slug: "${page.slug}"
- title: "${page.title}"
- cluster: "${page.cluster}"
- diagnostic_mermaid_cluster: "${page.cluster}"
- diagnostic_flow_template_key: "${templateKeyForTrade(page.trade)}"
- diagnostic_flow_issue_label: align with the page title / symptom

Output rules:
- Return ONLY a single JSON object (no markdown fences, no commentary).
- You MAY include "layout" and "schema_version" for your own checklist; they will be ignored — the server rebuilds them.
- Every required field in the lock doc skeleton must be non-empty and validator-safe.
- related_pages: array of 3 same-trade slug strings (registry-style paths like "plumbing/other-slug").
- pillar_page: one hub-style slug string for the trade.
`;

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content:
          "You are a 30-year veteran residential diagnostic technician. Output one JSON object only. No markdown fences.",
      },
      { role: "user", content: user },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty model response");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripJsonFence(text)) as Record<string, unknown>;
  } catch {
    throw new Error(`Model did not return valid JSON (first 200 chars): ${text.slice(0, 200)}`);
  }

  delete parsed.layout;
  delete parsed.schema_version;

  const merged = {
    ...parsed,
    trade: page.trade,
    slug: page.slug,
    title: page.title,
    cluster: page.cluster,
    diagnostic_mermaid_cluster: page.cluster,
    diagnostic_flow_template_key:
      (parsed.diagnostic_flow_template_key as string | undefined)?.trim() ||
      templateKeyForTrade(page.trade),
  } as DgAuthorityV3PageInput;

  return merged;
}

async function run(mode: "demos" | "llm") {
  const tmpDir = path.join(process.cwd(), "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  const gen =
    mode === "demos"
      ? async (page: PageSpec) => inputFromDemos(page)
      : async (page: PageSpec) => generateWithLLM(page);

  for (const page of pagesToGenerate) {
    console.log(`Generating: ${page.slug}`);
    const input = await gen(page);
    const validated = buildDgAuthorityV3Page(input);
    const fileName = `${page.slug.replace(/\//g, "_")}.json`;
    const outPath = path.join(tmpDir, fileName);
    fs.writeFileSync(outPath, JSON.stringify(validated, null, 2), "utf8");
    console.log(`Saved draft: ${outPath}`);
  }
}

const arg = process.argv[2]?.trim().toLowerCase();
const mode: "demos" | "llm" | null =
  arg === "--from-demos" || arg === "--demos" ? "demos" : arg === "--llm" ? "llm" : null;

if (!mode) {
  console.error(`Usage: npx tsx scripts/generateAuthorityBatch.ts --from-demos | --llm`);
  process.exit(1);
}

run(mode).catch((e) => {
  console.error(e);
  process.exit(1);
});
