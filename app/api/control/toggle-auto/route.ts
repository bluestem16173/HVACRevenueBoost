import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action } = await req.json();
    const newValue = action === 'ON' ? 'ON' : 'OFF';

    await sql`
      INSERT INTO system_state (key, value)
      VALUES ('auto_mode', ${newValue})
      ON CONFLICT (key) DO UPDATE SET value = ${newValue}, updated_at = NOW()
    `;

    try {
      await sql`
        INSERT INTO system_logs (event_type, message, metadata)
        VALUES ('control_action', 'Toggled Auto Mode', ${JSON.stringify({ auto_mode: newValue }) as any})
      `;
    } catch (e) { console.error('Failed to log toggle action:', e); }

    return NextResponse.json({ success: true, auto_mode: newValue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
