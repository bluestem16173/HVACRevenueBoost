import twilio from 'twilio';
import dotenv from 'dotenv';

// Load variables from .env.local
dotenv.config({ path: '.env.local' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// You can swap "from" with "messagingServiceSid: process.env.TWILIO_MG_SID" if preferred!
const fromNumber = process.env.TWILIO_FROM_NUMBER || "+1YOUR_TWILIO_NUMBER";
const toNumber = process.env.LEAD_NOTIFY_SMS_TO || "+1YOURNUMBER";

if (!accountSid || !authToken) {
  console.error("❌ Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in .env.local");
  process.exit(1);
}

console.log(`🚀 Attempting to send test SMS to: ${toNumber}`);

const client = twilio(accountSid, authToken);

async function testSMS() {
  try {
    const message = await client.messages.create({
      to: toNumber,
      from: fromNumber,
      body: "🔥 Test message: HVAC Revenue Boost Twilio Integration is LIVE!"
    });
    console.log(`✅ Success! Message delivered. SID: ${message.sid}`);
  } catch (err) {
    console.error("❌ Failed to send message:");
    console.error(err);
  }
}

testSMS();
