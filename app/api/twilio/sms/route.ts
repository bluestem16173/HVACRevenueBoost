import { NextResponse } from 'next/server';
import twilio from 'twilio';

const { twiml } = twilio;

export async function POST(req: Request) {
  try {
    // Twilio sends SMS payloads as form-urlencoded
    const text = await req.text();
    const params = new URLSearchParams(text);
    
    const body = params.get('Body')?.trim().toLowerCase() || "";
    const from = params.get('From');

    const response = new twiml.MessagingResponse();

    if (body === "yes") {
      // 🔥 mark lead as qualified
      console.log("QUALIFIED:", from);
      
      // Additional update logic can be run here!
      // sql`UPDATE leads SET status='qualified' WHERE phone=${from}`

      response.message("Connecting you with a technician now...");

    } else if (body === "claim") {
      // 🔥 vendor claiming lead
      console.log("CLAIM:", from);

      response.message("Lead assigned to you.");

    } else if (body === "stop") {
      response.message("You have been unsubscribed.");

    } else {
      response.message("Reply YES to connect with a technician.");
    }

    return new NextResponse(response.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error("Twilio Webhook Error:", error);
    return new NextResponse("Error processing webhook", { status: 500 });
  }
}
