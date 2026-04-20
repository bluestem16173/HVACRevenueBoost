import type { Metadata } from "next";

import {
  SMS_CONSENT_FULL_TEXT,
  SMS_CONSENT_ORIGINATION_DISCLOSURE,
  SMS_CONSENT_SAMPLE_MESSAGE,
} from "@/lib/lead-consent";

export const metadata: Metadata = {
  title: "Privacy Policy | HVAC Revenue Boost",
  description: "Privacy policy for HVAC Revenue Boost regarding how we collect and use your data.",
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 20 }}>
      <h1>Privacy Policy</h1>

      <h2>Information We Collect</h2>
      <p>
        We collect information you provide, including name, phone number, and service request details.
      </p>

      <h2>How We Use Information</h2>
      <p>
        We use this information to connect you with local service providers and communicate with you via SMS.
      </p>

      <h2>SMS Consent</h2>
      <p>
        <strong>Opt-in message</strong> (the language you affirm with the SMS consent checkbox):
      </p>
      <blockquote
        style={{
          margin: "12px 0",
          padding: "12px 16px",
          borderLeft: "4px solid #1e3a5f",
          background: "#f8fafc",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {SMS_CONSENT_FULL_TEXT}
      </blockquote>
      <p>
        <strong>Consent description</strong> (how we use SMS and where numbers come from):
      </p>
      <p>{SMS_CONSENT_ORIGINATION_DISCLOSURE}</p>
      <p>
        <strong>Sample message</strong> (example of a follow-up text after you opt in; actual wording may vary):
      </p>
      <blockquote
        style={{
          margin: "12px 0",
          padding: "12px 16px",
          borderLeft: "4px solid #0369a1",
          background: "#f0f9ff",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {SMS_CONSENT_SAMPLE_MESSAGE}
      </blockquote>
      <p>
        Message frequency varies. Msg &amp; data rates may apply. Reply <strong>STOP</strong> to opt out. Reply{" "}
        <strong>HELP</strong> for help.
      </p>

      <h2>Data Sharing</h2>
      <p>
        We may share your information with third-party providers to fulfill your request.
      </p>

      <h2>Security</h2>
      <p>
        We take reasonable steps to protect your data.
      </p>

      <br />
      <p>
        For questions, contact us at support@hvacrevenueboost.com
      </p>
    </main>
  );
}
