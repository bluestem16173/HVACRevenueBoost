import { spawn, ChildProcess } from 'child_process';
import sql from "@/lib/db";
import { runBulkAudit } from "./auditor";

const activeRuns = new Map<string, ChildProcess>();

export async function processQueue() {
  // 1. Fetch NEXT queued run and lock it ATOMICALLY
  const lockResult = await sql`
    UPDATE orchestrator_runs 
    SET status = 'running', started_at = NOW() 
    WHERE id = (
      SELECT id FROM orchestrator_runs 
      WHERE status = 'queued' 
      ORDER BY created_at ASC 
      LIMIT 1 
      FOR UPDATE SKIP LOCKED
    ) 
    RETURNING *;
  `;

  if (!lockResult || lockResult.length === 0) {
    return null; // No runs in queue
  }

  const run = lockResult[0];
  const runId = run.id;
  const project = run.project;
  const max_cost = parseFloat(run.max_cost || "0");
  let actual_cost = 0;

  await sql`
    INSERT INTO orchestrator_run_steps (run_id, step_name, status, message)
    VALUES (${runId}, 'worker_init', 'info', 'Spawning Next.js Generation Worker via Executable stream')
  `;

  const child = spawn('npx', ['tsx', 'scripts/generation-worker.ts', '--manual', '--limit', String(run.batch_size)], {
    env: { ...process.env, PROJECT: project }
  });

  activeRuns.set(runId, child);

  child.stdout.on('data', async (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;

      if (line.includes("ORCH::PAGE_CREATED=")) {
        try {
          const payload = JSON.parse(line.split("ORCH::PAGE_CREATED=")[1]);
          await sql`
            INSERT INTO orchestrator_run_pages (run_id, slug, url, status)
            VALUES (${runId}, ${payload.slug}, ${payload.url}, 'created')
          `;
        } catch(e) {}
      } 
      else if (line.includes("ORCH::ERROR=")) {
        try {
          const payload = JSON.parse(line.split("ORCH::ERROR=")[1]);
          await sql`
            INSERT INTO orchestrator_run_pages (run_id, slug, error, status)
            VALUES (${runId}, ${payload.slug}, ${payload.error}, 'failed')
          `;
        } catch(e) {}
      }
      else if (line.includes("ORCH::METRIC=")) {
        try {
          const payload = JSON.parse(line.split("ORCH::METRIC=")[1]);
          actual_cost += payload.cost || 0;
          const tokens_pm = payload.tokens_per_minute || 0;
          const requests_pm = payload.requests_per_minute || 0;
          const limit_count = payload["429_count"] || 0;

          await sql`
            UPDATE orchestrator_runs 
            SET actual_cost = ${actual_cost},
                tokens_per_minute = GREATEST(tokens_per_minute, ${tokens_pm}),
                requests_per_minute = GREATEST(requests_per_minute, ${requests_pm}),
                rate_limit_count = rate_limit_count + ${limit_count}
            WHERE id = ${runId}
          `;

          if (max_cost > 0 && actual_cost > max_cost) {
            console.log("🛑 Cost limit exceeded. Killing process.");
            child.kill('SIGTERM');
            await sql`
              UPDATE orchestrator_runs SET status = 'stopped_cost_limit', error_message = 'Max Cost Bound Triggered' WHERE id = ${runId}
            `;
            await sql`
              INSERT INTO orchestrator_run_steps (run_id, step_name, status, message)
              VALUES (${runId}, 'cost_guard_trigger', 'warn', 'Worker hard terminated due to exceeding budget bounds')
            `;
          }
        } catch(e) {}
      }
      else if (line.includes("ORCH::COMPLETE=")) {
        await sql`
          INSERT INTO orchestrator_run_steps (run_id, step_name, status, message)
          VALUES (${runId}, 'worker_complete', 'info', 'Worker successfully flushed batch')
        `;
      }
    }
  });

  child.stderr.on('data', (data) => {
    console.error("Worker output:", data.toString());
  });

  child.on('close', async (code) => {
    activeRuns.delete(runId);
    
    // Re-check status in case we killed it manually/cost limit
    const dbRun = await sql`SELECT status FROM orchestrator_runs WHERE id = ${runId}`;
    const safeDbStatus = dbRun[0]?.status || 'running';
    
    let finalStatus = code === 0 ? 'completed' : 'failed';
    if (safeDbStatus === 'stopped_cost_limit' || safeDbStatus === 'stopped') {
      finalStatus = safeDbStatus;
    }

    await sql`
      UPDATE orchestrator_runs 
      SET status = ${finalStatus}, ended_at = NOW() 
      WHERE id = ${runId}
    `;

    if (finalStatus !== 'failed') {
      await sql`
        INSERT INTO orchestrator_run_steps (run_id, step_name, status, message)
        VALUES (${runId}, 'audit_engine', 'info', 'Triggering 100-point structural page audits + Fix Engine')
      `;
      // Run the Auto-Healing Loop Audit
      await runBulkAudit(runId);
    }

    await sql`
      INSERT INTO orchestrator_run_steps (run_id, step_name, status, message)
      VALUES (${runId}, 'closing', 'info', 'Run completed processing lifecycle')
    `;
    
    // Automatically trigger next job if one exists
    processQueue().catch(() => {});
  });

  return runId;
}

export async function stopRun(runId: string) {
  const child = activeRuns.get(runId);
  if (child) {
    child.kill('SIGKILL');
    activeRuns.delete(runId);
    await sql`
      UPDATE orchestrator_runs SET status = 'stopped', ended_at = NOW(), error_message = 'Manually terminated by user execution halt' WHERE id = ${runId}
    `;
    await sql`
      INSERT INTO orchestrator_run_steps (run_id, step_name, status, message)
      VALUES (${runId}, 'cost_guard_trigger', 'warn', 'Run forcibly bypassed and killed by orchestrator UI')
    `;
    return true;
  }
  return false;
}
