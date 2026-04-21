import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { sendLeadSMS } from "@/lib/twilio/send-sms";
import { SMS_CONSENT_TEXT_VERSION } from "@/lib/lead-consent";

/**
 * Optional per-trade admin SMS destinations (E.164). When unset, {@link sendLeadSMS} falls back to
 * `TWILIO_ADMIN_ALERT_PHONE` / `TWILIO_TO_NUMBER`.
 *
 * - `TWILIO_ADMIN_ALERT_PHONE_PLUMBING`
 * - `TWILIO_ADMIN_ALERT_PHONE_ELECTRICAL`
 * - `TWILIO_ADMIN_ALERT_PHONE_HVAC` (non-RV residential/commercial HVAC)
 * - `TWILIO_ADMIN_ALERT_PHONE_RV_HVAC` (falls back to `TWILIO_ADMIN_ALERT_PHONE_HVAC` then global default)
 */
function adminAlertSmsToForSystemType(st: string): string | undefined {
  const direct =
    (st === "plumbing" && process.env.TWILIO_ADMIN_ALERT_PHONE_PLUMBING?.trim()) ||
    (st === "electrical" && process.env.TWILIO_ADMIN_ALERT_PHONE_ELECTRICAL?.trim()) ||
    (st === "rv_hvac" &&
      (process.env.TWILIO_ADMIN_ALERT_PHONE_RV_HVAC?.trim() || process.env.TWILIO_ADMIN_ALERT_PHONE_HVAC?.trim())) ||
    (st === "hvac" && process.env.TWILIO_ADMIN_ALERT_PHONE_HVAC?.trim()) ||
    undefined;
  return direct || undefined;
}

function consentAckSmsBody(firstName: string, st: string): string {
  const tail =
    " We'll text you about scheduling and service updates. Msg & data rates may apply. Reply STOP to opt out. Reply HELP for help.";
  if (st === "plumbing") return `Thanks ${firstName}, we received your plumbing request.${tail}`;
  if (st === "electrical") return `Thanks ${firstName}, we received your electrical request.${tail}`;
  if (st === "rv_hvac") return `Thanks ${firstName}, we received your RV HVAC request.${tail}`;
  return `Thanks ${firstName}, we received your request.${tail}`;
}

export type Lead = {
  id?: string;
  first_name?: string;
  name?: string;
  phone: string;
  location_raw: string;
  zip?: string;
  city?: string;
  state?: string;
  service_type: "hvac" | "rv_hvac" | "plumbing" | "electrical";
  issue: string;
  urgency: "asap" | "today" | "week" | string;
  source_page?: string;
  sms_consent?: boolean;
  consent_at?: string;
  consent_text_version?: string;
  created_at?: string;
  /** Storage-style path from URL (no leading slash). */
  page_slug?: string;
  /** City segment from localized URL (e.g. `fort-myers-fl`). */
  page_city_slug?: string;
  /** Trade segment from URL when present (hvac | plumbing | electrical). */
  trade?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_term?: string;
};

export async function POST(req: Request) {
  try {
    const body: Partial<Lead> & { sms_opt_in?: boolean } = await req.json();

    const smsConsent = body.sms_consent === true;
    if (!smsConsent) {
      return NextResponse.json(
        { error: "You must agree to receive SMS messages to continue." },
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

    const hasLocation = Boolean(String(location_raw || "").trim());
    if (!firstName || !phone || phone.length < 10 || !hasLocation) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid fields: first name, a valid 10-digit phone number, and ZIP or city are required.",
        },
        { status: 400 }
      );
    }

    const b = body as Record<string, unknown>;
    const pageSlugAttr = String(b.page_slug ?? "").trim().slice(0, 512);
    const pageCitySlugAttr = String(b.page_city_slug ?? "").trim().toLowerCase().slice(0, 128);
    const routeTradeAttr = String(b.trade ?? "").trim().toLowerCase().slice(0, 32);
    const utmSource = String(b.utm_source ?? "").trim().slice(0, 256);
    const utmCampaign = String(b.utm_campaign ?? "").trim().slice(0, 256);
    const utmTerm = String(b.utm_term ?? "").trim().slice(0, 256);

    let citySlug: string | null = null;
    if (pageCitySlugAttr && /^[a-z0-9-]+-[a-z]{2}$/.test(pageCitySlugAttr)) {
      try {
        const found = await sql`SELECT slug FROM cities WHERE LOWER(slug) = ${pageCitySlugAttr} LIMIT 1`;
        if ((found as { slug: string }[]).length) citySlug = (found as { slug: string }[])[0].slug;
        else citySlug = pageCitySlugAttr;
      } catch {
        citySlug = pageCitySlugAttr;
      }
    }
    if (!citySlug && city) {
      const slug = city.toLowerCase().replace(/\s+/g, "-");
      try {
        const found = await sql`SELECT slug FROM cities WHERE slug = ${slug} LIMIT 1`;
        if ((found as { slug: string }[]).length) citySlug = (found as { slug: string }[])[0].slug;
      } catch {
        /* ignore */
      }
    }

    const st =
      service_type === "rv_hvac"
        ? "rv_hvac"
        : service_type === "plumbing"
          ? "plumbing"
          : service_type === "electrical"
            ? "electrical"
            : "hvac";
    const src = (source_page || "/").toString().slice(0, 2048);
    const attrLine = [
      pageSlugAttr && `page_slug=${pageSlugAttr}`,
      pageCitySlugAttr && `page_city=${pageCitySlugAttr}`,
      routeTradeAttr && `route_trade=${routeTradeAttr}`,
      utmSource && `utm_source=${utmSource}`,
      utmCampaign && `utm_campaign=${utmCampaign}`,
      utmTerm && `utm_term=${utmTerm}`,
    ]
      .filter(Boolean)
      .join(" ");

    const insertWithAttribution = async () => {
      await sql`
        INSERT INTO leads (
          first_name, last_name, phone, zip_code,
          system_type, issue_description, urgency,
          city_slug, status,
          sms_consent, sms_consent_at, sms_consent_text_version, source_page,
          page_slug, page_city_slug, utm_source, utm_campaign, utm_term
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
          ${src},
          ${pageSlugAttr || null},
          ${pageCitySlugAttr || null},
          ${utmSource || null},
          ${utmCampaign || null},
          ${utmTerm || null}
        )
      `;
    };

    const insertConsentOnly = async () => {
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
    };

    const insertLegacy = async () => {
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
    };

    try {
      await insertWithAttribution();
      console.log("[API/LEAD] Lead archived in database (with SMS consent + attribution).");
    } catch (dbErr: unknown) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      const missingCol = msg.includes("42703") || msg.includes("column") || msg.includes("page_slug");
      if (missingCol) {
        try {
          await insertConsentOnly();
          console.log("[API/LEAD] Lead archived (consent columns; run db:migrate-021 for attribution columns).");
        } catch (dbErr2: unknown) {
          const msg2 = dbErr2 instanceof Error ? dbErr2.message : String(dbErr2);
          if (msg2.includes("sms_consent") || msg2.includes("42703") || msg2.includes("column")) {
            await insertLegacy();
            console.warn("[API/LEAD] Inserted without consent columns — run npm run db:migrate-020 on this database.");
          } else {
            console.error("[API/LEAD] DB insert failed:", dbErr2);
          }
        }
      } else {
        console.error("[API/LEAD] DB insert failed:", dbErr);
      }
    }

    const displayName = `${firstName}${lastName ? ` ${lastName}` : ""}`.trim();

    try {
      const tradeLabel =
        st === "plumbing" ? "Plumbing" : st === "electrical" ? "Electrical" : st === "rv_hvac" ? "RV HVAC" : "HVAC";
      const adminTo = adminAlertSmsToForSystemType(st);
      const adminMessage = await sendLeadSMS(
        `New ${tradeLabel} lead (consent ${consentVersion} @ ${consentAt})\nName: ${displayName}\nPhone: ${phone}\nIssue: ${issue || "N/A"}\nLocation: ${location_raw || "N/A"}\nSource: ${src}${attrLine ? `\nAttribution: ${attrLine}` : ""}`,
        adminTo
      );
      console.log("TWILIO RESPONSE (ADMIN):", adminMessage);

      if (smsConsent && phone) {
        const message = await sendLeadSMS(consentAckSmsBody(firstName, st), phone);
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
