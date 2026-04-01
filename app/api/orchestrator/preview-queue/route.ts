import { NextResponse } from "next/server";
import { peekQueuedJobs } from "@/lib/generation-queue";
import { buildQueueJobPreviewUrl } from "@/lib/orchestrator/preview-url";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * GET — next queued jobs (read-only) + live preview URLs for orchestrator gate.
 * Headers: x-orchestrator-secret (required in production)
 * Query: batchSize (default 10, max 50), pageType (optional — filter queue rows)
 */
export async function GET(req: Request) {
  const auth = req.headers.get("x-orchestrator-secret");
  if (process.env.NODE_ENV === "production" && auth !== process.env.ORCHESTRATOR_SECRET) {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(req.url);
    const batchSize = Math.min(50, Math.max(1, Number(searchParams.get("batchSize")) || 10));
    const pageType = searchParams.get("pageType") || undefined;

    const rows = await peekQueuedJobs(batchSize, pageType);
    const jobs = rows.map((job) => ({
      id: job.id,
      proposed_slug: job.proposed_slug,
      proposed_title: job.proposed_title,
      page_type: job.page_type,
      status: job.status,
      city: job.city,
      created_at: job.created_at,
      attempt_count: job.attempt_count,
      previewUrl: buildQueueJobPreviewUrl(job as Record<string, unknown>),
    }));

    return NextResponse.json({
      ok: true,
      count: jobs.length,
      jobs,
      hint: "Open each preview URL to see the current live page (if published). The run will regenerate content for these slugs.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
