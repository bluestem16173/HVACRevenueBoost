import { NextResponse } from "next/server";

export async function POST(req: Request) {
  return NextResponse.json({ error: "❌ LEGACY API ROUTE DISABLED" }, { status: 410 });
}
