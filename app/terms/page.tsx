import type { Metadata } from "next";

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
        Users must provide consent before receiving SMS communications. Message frequency varies based on service requests.
        By submitting your information, you consent to receive SMS messages related to your service request.
        Message and data rates may apply. Reply STOP to opt out.
      </p>

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
