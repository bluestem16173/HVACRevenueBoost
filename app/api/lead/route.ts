import { NextResponse } from 'next/server';
import sql from '@/lib/db';

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

    // Resolve city_slug - only use if it matches a known city to satisfy FK
    let citySlug: string | null = null;
    if (body.city) {
      const slug = body.city.toLowerCase().replace(/\s+/g, '-');
      try {
        const found = await sql`SELECT slug FROM cities WHERE slug = ${slug} LIMIT 1`;
        if ((found as any[]).length) citySlug = (found as any[])[0].slug;
      } catch {}
    }

    // Store in leads table (shared schema)
    try {
      await sql`
        INSERT INTO leads (
          first_name, last_name, email, phone, zip_code,
          system_type, issue_description, urgency, preferred_contact_time,
          city_slug, status
        ) VALUES (
          ${body.firstName || ''},
          ${body.lastName || ''},
          ${body.email || ''},
          ${body.phone || ''},
          ${body.zip || ''},
          ${body.systemType || null},
          ${body.service || null},
          ${body.urgency || null},
          ${body.preferredContactTime || null},
          ${citySlug},
          'new'
        )
      `;
      console.log('[API/LEAD] Lead archived in database');
    } catch (dbErr) {
      console.error('[API/LEAD] DB insert failed (table may not exist yet):', dbErr);
    }

    // Forward to GHL Webhook
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
        systemType: body.systemType,
        urgency: body.urgency,
        preferredContactTime: body.preferredContactTime,
        source: 'HVACRevenueBoost-Modal',
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      console.error(`[API/LEAD] GHL Webhook failed with status ${response.status}`);
    } else {
      console.log('[API/LEAD] Lead successfully pushed to GHL Webhook.');
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
