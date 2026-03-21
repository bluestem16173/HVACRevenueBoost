import { NextResponse } from "next/server";
import sql from "@/lib/db";
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || "10";

    const engineUrl = process.env.ENGINE_URL;
    if (!engineUrl) {
      return NextResponse.json({ error: "ENGINE_URL not configured" }, { status: 500 });
    }

    const response = await fetch(`${engineUrl}/internal/run-worker`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ADMIN_TOKEN}`
      },
      body: JSON.stringify({ limit })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Worker failed: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    
    // Log the action to system_logs instead of control_logs
    try {
      await sql`
        INSERT INTO system_logs (event_type, message, metadata)
        VALUES ('control_action', 'Triggered run via control API', ${JSON.stringify({ limit }) as any})
      `;
    } catch(e) { console.error('Failed to log run action:', e); }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
