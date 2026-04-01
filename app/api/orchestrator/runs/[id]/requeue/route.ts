import { NextResponse } from 'next/server';
import sql from "@/lib/db";
import { processQueue } from '@/lib/orchestrator/runner';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = req.headers.get('x-orchestrator-secret');
  if (process.env.NODE_ENV === 'production' && auth !== process.env.ORCHESTRATOR_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slugs } = await req.json();
    const { id } = params;

    if (!slugs || slugs.length === 0) {
      return NextResponse.json({ error: 'No slugs provided' }, { status: 400 });
    }

    // 1. Reset generation_queue logic but preserve last_error so the AI Auto-Heals!
    for (const slug of slugs) {
      // Fetch active recommendations to extract explicitly forced logic prompt_flags
      const audits = await sql`
        SELECT recommendations FROM orchestrator_page_audits
        WHERE run_id = ${id} AND page_slug = ${slug}
        ORDER BY created_at DESC LIMIT 1
      `;
      
      let mergedFlags: any = {};
      if (audits.length > 0 && audits[0].recommendations) {
        const recs = typeof audits[0].recommendations === 'string' ? JSON.parse(audits[0].recommendations) : audits[0].recommendations;
        for (const rec of recs) {
          if (rec.prompt_flags) {
            mergedFlags = { ...mergedFlags, ...rec.prompt_flags };
          }
        }
      }

      await sql`
        UPDATE generation_queue
        SET 
          status = 'draft', 
          attempts = 0,
          orchestrator_options = ${JSON.stringify(mergedFlags)}::jsonb
        WHERE proposed_slug = ${slug}
      `;
      // Delete the broken rendered page to ensure a clean overwrite
      await sql`DELETE FROM pages WHERE slug = ${slug}`;
    }

    // 2. Initialize a subsequent Orchestrator execution to handle the Requeue
    const newRun = await sql`
      INSERT INTO orchestrator_runs (status, project, batch_size, max_cost)
      VALUES ('queued', 'Auto-Healing Requeue', ${slugs.length}, 2.00)
      RETURNING id
    `;

    // Fire and forget
    processQueue().catch(e => console.error("Requeue trigger err:", e));

    return NextResponse.json({ success: true, newRunId: newRun[0].id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
