import { NextResponse } from 'next/server';
import sql from "@/lib/db";
import { processQueue } from '@/lib/orchestrator/runner';

export async function POST(req: Request) {
  const auth = req.headers.get('x-orchestrator-secret');
  if (process.env.NODE_ENV === 'production' && auth !== process.env.ORCHESTRATOR_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { project, batchSize, maxCost } = await req.json();

    const run = await sql`
      INSERT INTO orchestrator_runs (status, project, batch_size, max_cost)
      VALUES ('queued', ${project || 'HVAC'}, ${batchSize || 10}, ${maxCost || 5.00})
      RETURNING id
    `;

    // Async trigger processing to handle the Queue
    processQueue().catch(e => console.error("Queue trigger error:", e));

    return NextResponse.json({ success: true, runId: run[0].id, status: 'queued' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
