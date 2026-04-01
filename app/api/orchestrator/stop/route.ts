import { NextResponse } from 'next/server';
import { stopRun } from '@/lib/orchestrator/runner';

export async function POST(req: Request) {
  const auth = req.headers.get('x-orchestrator-secret');
  if (process.env.NODE_ENV === 'production' && auth !== process.env.ORCHESTRATOR_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { runId } = await req.json();

    if (!runId) return NextResponse.json({ error: 'runId required' }, { status: 400 });

    const killed = await stopRun(runId);

    return NextResponse.json({ success: true, stopped: killed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
