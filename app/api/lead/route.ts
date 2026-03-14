import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verify required fields
    if (!body.firstName || !body.phone || !body.zip) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In production, this URL would come from process.env.GHL_WEBHOOK_URL
    // For now, we will use a resilient try-catch to attempt the webhook
    const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL || 'https://services.leadconnectorhq.com/hooks/BvM4rA6CgU4s3C4xG7T';
    
    console.log(`[API/LEAD] Received lead for ${body.firstName} in ${body.city}, ${body.state}`);

    const response = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
        address: body.address,
        city: body.city,
        state: body.state,
        zip: body.zip,
        service: body.service,
        source: 'Modal Lead Capture',
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      console.error(`[API/LEAD] GHL Webhook failed with status ${response.status}`);
      // We still return success to the user so they don't get stuck if the CRM goes down
    } else {
      console.log(`[API/LEAD] Lead successfully pushed to GHL Webhook.`);
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[API/LEAD] Server Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
