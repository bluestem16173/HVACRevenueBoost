import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { sendLeadSMS } from "@/lib/twilio/send-sms";
import { SMS_CONSENT_TEXT_VERSION } from "@/lib/lead-consent";

export type Lead = {
  id?: string;
  first_name?: string;
  name?: string;
  phone: string;
  location_raw: string;
  zip?: string;
  city?: string;
  state?: string;
  service_type: "hvac" | "rv_hvac";
  issue: string;
  urgency: "asap" | "today" | "week" | string;
  source_page?: string;
  sms_consent?: boolean;
  consent_at?: string;
  consent_text_version?: string;
  created_at?: string;
};

export async function POST(req: Request) {
  try {
    const body: Partial<Lead> & { sms_opt_in?: boolean } = await req.json();

    const smsConsent = body.sms_consent === true;
    if (!smsConsent) {
      return NextResponse.json(
        { error: "SMS consent is required to submit this form." },
        { status: 400 }
      );
    }

    const consentAt = body.consent_at?.trim() || new Date().toISOString();
    const consentVersion = body.consent_text_version?.trim() || SMS_CONSENT_TEXT_VERSION;

    const firstName =
      String(body.first_name || "")
        .trim()
        .split(/\s+/)[0] ||
      String(body.name || "")
        .trim()
        .split(/\s+/)[0] ||
      "";
    const lastName =
      String(body.first_name || "").trim().includes(" ")
        ? String(body.first_name).trim().split(/\s+/).slice(1).join(" ")
        : String(body.name || "")
            .trim()
            .split(/\s+/)
            .slice(1)
            .join(" ");

    let { phone, location_raw, urgency, service_type, issue, source_page } = body;
    const phoneDigits = String(phone || "").replace(/\D/g, "").replace(/^1/, "").slice(0, 10);
    phone = phoneDigits;

    let zip = "";
    let city = "";
    let state = "";

    if (location_raw) {
      const zipMatch = String(location_raw).match(/\b\d{5}\b/);
      if (zipMatch) zip = zipMatch[0];

      if (String(location_raw).includes(",")) {
        const parts = String(location_raw).split(",");
        city = parts[0].trim();
        const statePart = parts[1]?.trim() || "";
        const stateMatch = statePart.match(/^[A-Za-z]{2}/);
        if (stateMatch) state = stateMatch[0].toUpperCase();
      } else if (!zip) {
        city = String(location_raw).trim();
      }
    }

    if (!firstName || !phone || phone.length < 10 || !location_raw) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid fields: first name, a valid 10-digit phone number, and ZIP or city are required.",
        },
        { status: 400 }
      );
    }

    let citySlug: string | null = null;
    if (city) {
      const slug = city.toLowerCase().replace(/\s+/g, "-");
      try {
        const found = await sql`SELECT slug FROM cities WHERE slug = ${slug} LIMIT 1`;
        if ((found as { slug: string }[]).length) citySlug = (found as { slug: string }[])[0].slug;
      } catch {
        /* ignore */
      }
    }

    const st = service_type === "rv_hvac" ? "rv_hvac" : "hvac";
    const src = (source_page || "/").toString().slice(0, 2048);

    try {
      await sql`
        INSERT INTO leads (
          first_name, last_name, phone, zip_code,
          system_type, issue_description, urgency,
          city_slug, status,
          sms_consent, sms_consent_at, sms_consent_text_version, source_page
        ) VALUES (
          ${firstName},
          ${lastName || ""},
          ${phone || ""},
          ${zip || location_raw || ""},
          ${st},
          ${issue || ""},
          ${urgency || "asap"},
          ${citySlug},
          'new',
          ${true},
          ${consentAt},
          ${consentVersion},
          ${src}
        )
      `;
      console.log("[API/LEAD] Lead archived in database (with SMS consent audit).");
    } catch (dbErr: unknown) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      if (msg.includes("sms_consent") || msg.includes("42703") || msg.includes("column")) {
        await sql`
          INSERT INTO leads (
            first_name, last_name, phone, zip_code,
            system_type, issue_description, urgency,
            city_slug, status
          ) VALUES (
            ${firstName},
            ${lastName || ""},
            ${phone || ""},
            ${zip || location_raw || ""},
            ${st},
            ${issue || ""},
            ${urgency || "asap"},
            ${citySlug},
            'new'
          )
        `;
        console.warn("[API/LEAD] Inserted without consent columns — run npm run db:migrate-020 on this database.");
      } else {
        console.error("[API/LEAD] DB insert failed:", dbErr);
      }
    }

    const displayName = `${firstName}${lastName ? ` ${lastName}` : ""}`.trim();

    try {
      const adminMessage = await sendLeadSMS(
        `New HVAC lead (consent ${consentVersion} @ ${consentAt})\nName: ${displayName}\nPhone: ${phone}\nIssue: ${issue || "N/A"}\nLocation: ${location_raw || "N/A"}\nSource: ${src}`
      );
      console.log("TWILIO RESPONSE (ADMIN):", adminMessage);

      if (smsConsent && phone) {
        const message = await sendLeadSMS(
          `Thanks ${firstName}, we received your request. We will contact you about your inquiry, scheduling, and service updates. Reply STOP to opt out. Reply HELP for help.`,
          phone
        );
        console.log("TWILIO RESPONSE (USER):", message);
      }
    } catch (twilioErr) {
      console.error("[API/LEAD] Twilio API Error:", twilioErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/LEAD] Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
