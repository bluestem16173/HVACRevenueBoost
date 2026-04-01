import { NextResponse } from 'next/server';
import sql from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = req.headers.get('x-orchestrator-secret');
  if (process.env.NODE_ENV === 'production' && auth !== process.env.ORCHESTRATOR_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    // Join Pages with Audits for the UI Table
    const pages = await sql`
      SELECT 
        p.id, p.slug, p.url, p.status, p.error, p.created_at,
        a.structure_score, a.seo_score, a.graph_score, a.content_score, a.total_score, a.status_band, a.recommendations
      FROM orchestrator_run_pages p
      LEFT JOIN orchestrator_page_audits a ON a.page_slug = p.slug AND a.run_id = p.run_id
      WHERE p.run_id = ${id}
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json({ pages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
