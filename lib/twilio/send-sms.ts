import Twilio from "twilio";

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendLeadSMS(message: string, to: string) {
  const response = await client.messages.create({
    body: message,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
    to: to,
  });

  return response;
}
