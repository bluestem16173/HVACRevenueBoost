import { sendLeadSMS } from "@/lib/twilio/send-sms";

export async function POST(req: Request) {
  const body = await req.json();

  console.log("STEP 1: BODY RECEIVED", body);

  try {
    console.log("STEP 2: CALLING TWILIO");

    const res = await sendLeadSMS(
      `🔥 New Lead\n${body.issue}\n${body.city}`,
      body.phone
    );

    console.log("STEP 3: TWILIO RESPONSE", res);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("❌ TWILIO ERROR:", err);
    return Response.json({ ok: false, error: err });
  }
}
