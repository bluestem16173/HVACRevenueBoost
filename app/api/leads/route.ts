import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("Lead captured:", data);

    // In production, this would be a fetch to GoHighLevel Webhook
    // const ghlWebhook = process.env.GHL_WEBHOOK_URL;
    // await fetch(ghlWebhook, { method: "POST", body: JSON.stringify(data) });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
