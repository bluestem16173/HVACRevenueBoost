/**
 * Twilio A2P 10DLC — frozen disclosure. Bump SMS_CONSENT_TEXT_VERSION if this literal ever changes.
 * Trust Hub / campaign "CTA + opt-in" must use SMS_CONSENT_FULL_TEXT verbatim (same bytes as the site checkbox).
 */
export const SMS_CONSENT_TEXT_VERSION = "hvacrb-a2p-10dlc-v3-2026-04-16";

/** Exact checkbox / campaign opt-in copy — one continuous literal; do not edit punctuation or spacing. */
export const SMS_CONSENT_FULL_TEXT =
  "I agree to receive SMS messages from HVAC Revenue Boost regarding my request, including follow-ups, scheduling, and service updates. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out. Reply HELP for help.";

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
