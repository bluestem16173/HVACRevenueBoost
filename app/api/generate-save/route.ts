import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.log("🚫 Generation globally disabled");
    return NextResponse.json(
      { error: "Generation disabled", code: "GENERATION_DISABLED" },
      { status: 403 }
    );
  }
  console.log("GENERATION TRIGGERED (legacy generate-save POST)", new Date());
  return NextResponse.json({ error: "❌ LEGACY API ROUTE DISABLED" }, { status: 410 });
}
