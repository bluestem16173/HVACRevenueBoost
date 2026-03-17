import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (process.env.NODE_ENV === "development") {
      console.log("TRACK EVENT:", body);
    }

    // TODO: insert into DB or analytics pipeline (e.g. PostHog, Mixpanel, custom table)

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
