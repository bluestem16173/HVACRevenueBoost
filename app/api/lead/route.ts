import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import twilio from 'twilio';

export type Lead = {
  id?: string;

  // core
  name: string;
  phone: string;
  location_raw: string;

  // normalized
  zip?: string;
  city?: string;
  state?: string;

  // context
  service_type: "hvac" | "rv_hvac";
  issue: string; // "ac_not_cooling"
  urgency: "asap" | "today" | "week" | string;

  // meta
  source_page: string; // slug
  created_at?: string;
};

export async function POST(req: Request) {
  try {
    const body: Partial<Lead> = await req.json();

    // 1. DYNAMIC NORMALIZATION
    let { 
      name, phone, location_raw, urgency, service_type, issue, source_page 
    } = body;
    
    let zip = '';
    let city = '';
    let state = '';

    // Normalizing Location (Smart Hybrid Parsing)
    if (location_raw) {
      // Check for ZIP (5 digits)
      const zipMatch = location_raw.match(/\b\d{5}\b/);
      if (zipMatch) zip = zipMatch[0];

      // Check for City, State framing
      if (location_raw.includes(',')) {
        const parts = location_raw.split(',');
        city = parts[0].trim();
        const statePart = parts[1].trim();
        const stateMatch = statePart.match(/^[A-Za-z]{2}/);
        if (stateMatch) state = stateMatch[0].toUpperCase();
      } else if (!zip) {
        // Fallback: they wrote something like "Near Orlando" 
        city = location_raw.trim();
      }
    }

    // 2. VERIFICATION
    if (!name || !phone || !location_raw) {
      return NextResponse.json(
        { error: 'Missing core fields: name, phone, and location are required.' },
        { status: 400 }
      );
    }

    // 3. DATABASE INGESTION
    let citySlug: string | null = null;
    if (city) {
      const slug = city.toLowerCase().replace(/\s+/g, '-');
      try {
        const found = await sql`SELECT slug FROM cities WHERE slug = ${slug} LIMIT 1`;
        if ((found as any[]).length) citySlug = (found as any[])[0].slug;
      } catch {}
    }

    try {
      await sql`
        INSERT INTO leads (
          first_name, last_name, phone, zip_code,
          system_type, issue_description, urgency, 
          city_slug, status
        ) VALUES (
          ${name?.split(' ')[0] || ''},
          ${name?.split(' ').slice(1).join(' ') || ''},
          ${phone || ''},
          ${zip || location_raw || ''},
          ${service_type || 'hvac'},
          ${issue || ''},
          ${urgency || ''},
          ${citySlug},
          'new'
        )
      `;
      console.log('[API/LEAD] Lead archived in database');
    } catch (dbErr) {
      console.error('[API/LEAD] DB insert failed:', dbErr);
    }

    // 4. TWILIO SMS NOTIFICATION & DISPATCH
    console.log(`[API/LEAD] Processing Twilio SMS to ${phone}`);
    
    // Assumes TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MG_SID are defined in .env
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const messagingServiceSid = process.env.TWILIO_MG_SID;
    const adminPhone = process.env.LEAD_NOTIFY_SMS_TO;

    if (accountSid && authToken && messagingServiceSid) {
      try {
        const client = twilio(accountSid, authToken);
        const textMessage = "Got your request — checking availability now. Reply YES to connect with a technician.";

        // 4a. SMS Confirmation to the Lead 
        await client.messages.create({
          body: textMessage,
          messagingServiceSid: messagingServiceSid,
          to: phone
        });
        console.log('[API/LEAD] Twilio confirmation SMS successfully sent to lead.');

        // 4b. SMS Alert to the Administrator
        if (adminPhone) {
          await client.messages.create({
            body: `🔥 NEW LEAD ALERT 🔥\nName: ${name}\nPhone: ${phone}\nLocation: ${location_raw}\nUrgency: ${urgency || 'N/A'}\nType: ${service_type || 'HVAC'}`,
            messagingServiceSid: messagingServiceSid,
            to: adminPhone
          });
          console.log('[API/LEAD] Twilio Admin Alert SMS successfully sent.');
        }

      } catch (twilioErr) {
        console.error('[API/LEAD] Twilio API Error:', twilioErr);
      }
    } else {
      console.warn('[API/LEAD] Twilio credentials missing in ENV. Skipping SMS dispatch. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MG_SID.');
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
