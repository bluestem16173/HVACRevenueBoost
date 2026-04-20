import { NextResponse } from "next/server";

import { getDatabaseUrlRuntimeSnapshot } from "@/lib/db/databaseUrlFingerprint";

export const dynamic = "force-dynamic";

/**
 * Compare with the first line of `npx tsx scripts/hsd-page-queue-worker.ts` output (`[db] source=…`).
 * Disabled in production unless `ALLOW_DB_FINGERPRINT_API=1`.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DB_FINGERPRINT_API !== "1") {
    return new NextResponse(null, { status: 404 });
  }
  const snapshot = getDatabaseUrlRuntimeSnapshot();
  return NextResponse.json({
    ok: Boolean(snapshot),
    snapshot,
    cwd: process.cwd(),
  });
}
