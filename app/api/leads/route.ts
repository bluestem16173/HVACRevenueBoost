import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("Lead captured:", data);

    const { name, phone, email, zip, urgency, problem, city, symptomId } = data;

    // 1. Archive in Neon Database
    // Split name into first/last
    const nameParts = (name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      await sql`
        INSERT INTO leads (
          first_name, 
          last_name, 
          email, 
          phone, 
          zip_code, 
          city, 
          symptom_id,
          status
        ) VALUES (
          ${firstName}, 
          ${lastName}, 
          ${email}, 
          ${phone}, 
          ${zip}, 
          ${city}, 
          ${symptomId || null},
          'new'
        )
      `;
      console.log("✅ Lead archived in Neon");
    } catch (dbErr) {
      console.error("❌ Neon Lead Archive Error:", dbErr);
      // We continue to webhook even if DB fails
    }

    // 2. Forward to GoHighLevel Webhook (if URL is set)
    const ghlWebhook = process.env.GHL_WEBHOOK_URL;
    if (ghlWebhook) {
      try {
        await fetch(ghlWebhook, { 
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            source: "DecisionGrid-SEO-Engine",
            first_name: firstName,
            last_name: lastName
          }) 
        });
        console.log("✅ Lead forwarded to Webhook");
      } catch (webhookErr) {
        console.error("❌ Webhook Forwarding Error:", webhookErr);
      }
    } else {
      console.warn("⚠️ GHL_WEBHOOK_URL not set, skipping forwarding.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fatal Lead capturing error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
