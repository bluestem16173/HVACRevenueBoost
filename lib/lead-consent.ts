/**
 * Twilio A2P 10DLC — each surface has its own frozen literal + version. Register variants in Trust Hub as needed.
 * Checkbox text must match these strings byte-for-byte for the active surface.
 */
export const SMS_CONSENT_TEXT_VERSION = "hvacrb-a2p-10dlc-v4-2026-04-18";

/** Exact HVAC checkbox copy — keep in sync with Trust Hub / 10DLC registration. */
export const SMS_CONSENT_FULL_TEXT =
  "By submitting this form, you agree to receive SMS messages from HVAC Revenue Boost regarding your inquiry, including follow-ups, scheduling, and service-related updates. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out. Reply HELP for help.";

/** Same disclosure body for plumbing + electrical; separate version strings for audit / Trust Hub rows. */
const SMS_CONSENT_FULL_TEXT_HOME_SERVICE_DIAGNOSTICS_TRADES =
  "By submitting this form, you agree to receive SMS messages from HomeServiceDiagnostics regarding your inquiry, including follow-ups, scheduling, and service-related updates. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out. Reply HELP for help.";

export const SMS_CONSENT_TEXT_VERSION_PLUMBING = "hvacrb-a2p-plumbing-hsd-v2-2026-04-19";

export const SMS_CONSENT_FULL_TEXT_PLUMBING = SMS_CONSENT_FULL_TEXT_HOME_SERVICE_DIAGNOSTICS_TRADES;

export const SMS_CONSENT_TEXT_VERSION_ELECTRICAL = "hvacrb-a2p-electrical-hsd-v2-2026-04-19";

export const SMS_CONSENT_FULL_TEXT_ELECTRICAL = SMS_CONSENT_FULL_TEXT_HOME_SERVICE_DIAGNOSTICS_TRADES;

export type SmsConsentSurface = "hvac" | "plumbing" | "electrical";

export function getSmsConsentFullText(surface: SmsConsentSurface): string {
  if (surface === "plumbing") return SMS_CONSENT_FULL_TEXT_PLUMBING;
  if (surface === "electrical") return SMS_CONSENT_FULL_TEXT_ELECTRICAL;
  return SMS_CONSENT_FULL_TEXT;
}

export function getSmsConsentTextVersion(surface: SmsConsentSurface): string {
  if (surface === "plumbing") return SMS_CONSENT_TEXT_VERSION_PLUMBING;
  if (surface === "electrical") return SMS_CONSENT_TEXT_VERSION_ELECTRICAL;
  return SMS_CONSENT_TEXT_VERSION;
}

/** Inline validation copy next to the consent checkbox. */
export const SMS_CONSENT_REQUIRED_ERROR = "You must agree to receive SMS messages to continue.";

/** Twilio A2P: keep neutral CTA until campaign approved; set to `false` after approval to restore urgency label. */
export const HVACRB_SMS_LEAD_USE_COMPLIANCE_SUBMIT_LABEL = true;

export const HVACRB_SMS_LEAD_SUBMIT_LABEL_COMPLIANCE = "Request Service";
export const HVACRB_SMS_LEAD_SUBMIT_LABEL_DEFAULT = "Get Help Now";

export function getSmsLeadSubmitButtonLabel(): string {
  return HVACRB_SMS_LEAD_USE_COMPLIANCE_SUBMIT_LABEL
    ? HVACRB_SMS_LEAD_SUBMIT_LABEL_COMPLIANCE
    : HVACRB_SMS_LEAD_SUBMIT_LABEL_DEFAULT;
}

/** Shown with the consent block on the modal card only; list / outreach policy (exact wording). */
export const SMS_CONSENT_ORIGINATION_DISCLOSURE =
  "We only send messages to users who directly submit a request through our website. We do not use purchased lists, third-party lists, marketing lists, or unsolicited outreach.";
