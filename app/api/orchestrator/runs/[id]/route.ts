import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = req.headers.get('x-orchestrator-secret');
  if (process.env.NODE_ENV === 'production' && auth !== process.env.ORCHESTRATOR_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    const runs = await sql`
      SELECT *
      FROM orchestrator_runs
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!runs || runs.length === 0) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const steps = await sql`
      SELECT *
      FROM orchestrator_run_steps
      WHERE run_id = ${id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ run: runs[0], steps });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
