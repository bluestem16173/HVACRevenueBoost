import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendLeadSMS } from '@/lib/twilio/send-sms';

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
    const body: Partial<Lead> & { smsOptIn?: boolean; sms_opt_in?: boolean } = await req.json();
    const smsOptIn = body.smsOptIn === true || body.sms_opt_in === true;

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
    
    try {
      // 🔥 Notify YOU instantly
      const adminMessage = await sendLeadSMS(
        `🔥 New HVAC Lead\nName: ${name}\nPhone: ${phone}\nIssue: ${issue || 'N/A'}\nLocation: ${location_raw || 'N/A'}`
      );
      console.log("TWILIO RESPONSE (ADMIN):", adminMessage);
      console.log('[API/LEAD] Twilio Admin Alert SMS successfully sent.');

      // Optional: confirm to user (TCPA-style gate — only when lead opts in)
      if (smsOptIn && phone) {
        const message = await sendLeadSMS(
          `Thanks ${name}, we received your request. A tech will contact you shortly.`,
          phone
        );
        console.log("TWILIO RESPONSE:", message);
        console.log("[API/LEAD] Twilio confirmation SMS successfully sent to lead.");
      } else {
        console.log("[API/LEAD] Skipping user confirmation SMS (sms opt-in false or missing).");
      }
    } catch (twilioErr) {
      console.error('[API/LEAD] Twilio API Error:', twilioErr);
      console.warn('[API/LEAD] Make sure TWILIO_ACCOUNT_SID at TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER are set in ENV.');
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
