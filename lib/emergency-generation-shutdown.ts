/**
 * Emergency auto shutdown when AI spend spikes (optional, DB-persisted).
 *
 * - Sets system_state.generation_emergency_shutdown = true and GENERATION_ENABLED in-memory to false.
 * - Other processes / next deploys read DB via isEmergencyGenerationShutdown() in the worker.
 *
 * Env:
 *   AI_EMERGENCY_SPIKE_DISABLED=true  — skip spike detection
 *   AI_SPIKE_THRESHOLD_USD            — e.g. 50 (default 50)
 *   AI_SPIKE_WINDOW_MINUTES           — rolling window (default 60)
 *
 * Clear: UPDATE system_state SET value = 'false' WHERE key = 'generation_emergency_shutdown';
 */
import sql from "@/lib/db";

export const EMERGENCY_SHUTDOWN_KEY = "generation_emergency_shutdown";

function spikeThresholdUsd(): number {
  const raw = process.env.AI_SPIKE_THRESHOLD_USD;
  if (raw === undefined || raw === "") return 50;
  const n = parseFloat(raw);
  return Number.isNaN(n) || n < 0 ? 50 : n;
}

function spikeWindowMinutes(): number {
  const raw = process.env.AI_SPIKE_WINDOW_MINUTES;
  if (raw === undefined || raw === "") return 60;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) || n < 1 ? 60 : Math.min(n, 24 * 60);
}

/** Estimated spend in the rolling window (UTC). */
export async function getSpendInWindowUsd(windowMinutes: number): Promise<number> {
  const w = Math.min(Math.max(windowMinutes, 1), 24 * 60);
  try {
    const rows = (await sql`
      SELECT COALESCE(SUM(cost_usd), 0)::float AS total
      FROM ai_usage
      WHERE created_at >= NOW() - (INTERVAL '1 minute' * ${w})
    `) as { total: number }[];
    return Number(rows[0]?.total ?? 0);
  } catch (e) {
    console.warn("[emergency-shutdown] getSpendInWindowUsd failed:", e);
    return 0;
  }
}

export async function isEmergencyGenerationShutdown(): Promise<boolean> {
  try {
    const rows = (await sql`
      SELECT value FROM system_state WHERE key = ${EMERGENCY_SHUTDOWN_KEY} LIMIT 1
    `) as { value: string }[];
    const v = rows[0]?.value;
    return v === "true" || v === "ON";
  } catch {
    return false;
  }
}

/** Persists kill switch + in-process env so this worker stops calling AI immediately. */
export async function triggerEmergencyGenerationShutdown(reason: string): Promise<void> {
  process.env.GENERATION_ENABLED = "false";
  try {
    await sql`
      INSERT INTO system_state (key, value, updated_at)
      VALUES (${EMERGENCY_SHUTDOWN_KEY}, 'true', NOW())
      ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = NOW()
    `;
    await sql`
      INSERT INTO system_logs (event_type, message)
      VALUES ('emergency_shutdown', ${reason})
    `;
  } catch (e) {
    console.error("[emergency-shutdown] persist failed:", e);
  }
  console.log("🚨 EMERGENCY AUTO SHUTDOWN — generation disabled:", reason);
}

/**
 * If rolling-window spend exceeds threshold, triggers shutdown. Call after recording usage.
 * Returns true if shutdown was triggered this call.
 */
export async function checkSpendSpikeAndShutdown(): Promise<boolean> {
  if (process.env.AI_EMERGENCY_SPIKE_DISABLED === "true") {
    return false;
  }
  if (await isEmergencyGenerationShutdown()) {
    return false;
  }
  const window = spikeWindowMinutes();
  const threshold = spikeThresholdUsd();
  const spend = await getSpendInWindowUsd(window);
  if (spend > threshold) {
    await triggerEmergencyGenerationShutdown(
      `spend_spike: $${spend.toFixed(4)} in ${window}m (threshold $${threshold})`
    );
    return true;
  }
  return false;
}

/** Alias for spike condition (testing / worker). */
export async function spendSpikeDetected(): Promise<boolean> {
  if (process.env.AI_EMERGENCY_SPIKE_DISABLED === "true") {
    return false;
  }
  const window = spikeWindowMinutes();
  const threshold = spikeThresholdUsd();
  const spend = await getSpendInWindowUsd(window);
  return spend > threshold;
}
