import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function GET(req: Request) {
  const auth = req.headers.get('x-orchestrator-secret');
  if (process.env.NODE_ENV === 'production' && auth !== process.env.ORCHESTRATOR_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Return latest 20 runs
    const runs = await sql`
      SELECT id, status, project, batch_size, max_cost, actual_cost, started_at, ended_at, error_message
      FROM orchestrator_runs
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({ runs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
