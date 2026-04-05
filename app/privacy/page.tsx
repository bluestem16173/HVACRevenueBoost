import type { Metadata } from "next";

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
        By submitting your information, you consent to receive SMS messages related to your request.
        You may opt out at any time by replying STOP.
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
