import Twilio from "twilio";

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

/** When `to` is omitted, uses `TWILIO_ADMIN_ALERT_PHONE` or `TWILIO_TO_NUMBER` (internal alert). */
export async function sendLeadSMS(message: string, to?: string) {
  const destination =
    to?.trim() ||
    process.env.TWILIO_ADMIN_ALERT_PHONE?.trim() ||
    process.env.TWILIO_TO_NUMBER?.trim();
  if (!destination) {
    throw new Error("sendLeadSMS: set `to` or TWILIO_ADMIN_ALERT_PHONE / TWILIO_TO_NUMBER");
  }

  const response = await client.messages.create({
    body: message,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
    to: destination,
  });

  return response;
}
