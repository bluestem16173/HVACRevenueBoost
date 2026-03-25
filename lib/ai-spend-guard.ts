/**
 * Layer 2 — Daily spend guard (USD). Prevents runaway OpenAI bills.
 * Env: AI_DAILY_LIMIT_USD (default 10). Set 0 to disable the cap.
 */
import { checkSpendSpikeAndShutdown } from "@/lib/emergency-generation-shutdown";
import sql from "@/lib/db";

/** Default $10/day — override with AI_DAILY_LIMIT_USD */
export const DEFAULT_DAILY_LIMIT_USD = 10;

/** Approximate $/token (input / output per 1 token). Tune as pricing changes. */
const RATES: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.5 / 1_000_000, out: 10 / 1_000_000 },
  "gpt-4o-mini": { in: 0.15 / 1_000_000, out: 0.6 / 1_000_000 },
};

export function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const r = RATES[model] ?? RATES["gpt-4o"];
  return promptTokens * r.in + completionTokens * r.out;
}

function dailyLimitUsd(): number {
  const raw = process.env.AI_DAILY_LIMIT_USD;
  if (raw === undefined || raw === "") return DEFAULT_DAILY_LIMIT_USD;
  const n = parseFloat(raw);
  if (Number.isNaN(n) || n < 0) return DEFAULT_DAILY_LIMIT_USD;
  return n;
}

/** Sum recorded spend for current UTC calendar day. */
export async function getTodaySpendUsd(): Promise<number> {
  try {
    const rows = (await sql`
      SELECT COALESCE(SUM(cost_usd), 0)::float AS total
      FROM ai_usage
      WHERE timezone('utc', created_at)::date = (timezone('utc', now()))::date
    `) as { total: number }[];
    return Number(rows[0]?.total ?? 0);
  } catch (e) {
    console.warn("[ai-spend-guard] getTodaySpendUsd failed (table missing?):", e);
    return 0;
  }
}

/**
 * Block generation when today’s total >= limit. Logs and throws so workers fail closed.
 */
export async function assertDailySpendAllows(source: string): Promise<void> {
  const limit = dailyLimitUsd();
  if (limit <= 0) return;

  const todaySpend = await getTodaySpendUsd();
  if (todaySpend >= limit) {
    console.log("💸 Daily budget hit — stopping");
    throw new Error(`DAILY_SPEND_LIMIT_REACHED: ${todaySpend.toFixed(4)} >= ${limit} USD (${source})`);
  }
}

/** Persist one completion for rollup + auditing. */
export async function recordAiUsage(opts: {
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  source?: string;
}): Promise<void> {
  try {
    await sql`
      INSERT INTO ai_usage (cost_usd, model_name, source, prompt_tokens, completion_tokens)
      VALUES (
        ${opts.costUsd},
        ${opts.model},
        ${opts.source ?? "generator"},
        ${opts.promptTokens},
        ${opts.completionTokens}
      )
    `;
  } catch (e) {
    console.warn("[ai-spend-guard] recordAiUsage failed:", e);
  }
}

/** After an OpenAI chat completion, log usage + cost estimate. */
export async function recordOpenAiChatUsage(
  model: string,
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
  source: string
): Promise<void> {
  const pt = usage?.prompt_tokens ?? 0;
  const ct = usage?.completion_tokens ?? 0;
  const costUsd = estimateCostUsd(model, pt, ct);
  await recordAiUsage({
    model,
    promptTokens: pt,
    completionTokens: ct,
    costUsd,
    source,
  });
  await checkSpendSpikeAndShutdown();
}
