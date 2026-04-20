import type { Metadata } from "next";

import { SMS_CONSENT_FULL_TEXT } from "@/lib/lead-consent";

export const metadata: Metadata = {
  title: "Terms & Conditions | HVAC Revenue Boost",
  description: "Terms and conditions for HVAC Revenue Boost.",
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 20 }}>
      <h1>Terms & Conditions</h1>

      <p>
        By using this website, you agree to the following terms:
      </p>

      <h2>Service Description</h2>
      <p>
        We connect users with local HVAC and home service providers based on submitted requests.
      </p>

      <h2>SMS Communications</h2>
      <p>
        Users must affirm the opt-in below before receiving SMS. Message frequency varies based on your inquiry,
        scheduling, and service-related updates. Msg &amp; data rates may apply. Reply STOP to opt out. Reply HELP for
        help.
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

      <h2>No Guarantee</h2>
      <p>
        We do not guarantee service availability, pricing, or outcomes from third-party providers.
      </p>

      <h2>Liability</h2>
      <p>
        We are not responsible for services performed by third-party providers.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms at any time.
      </p>

      <br />
      <p>
        For questions, contact us at support@hvacrevenueboost.com
      </p>
    </main>
  );
}
