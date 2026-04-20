import type { Metadata } from "next";
import Link from "next/link";
import RequestServiceClient from "@/components/RequestServiceClient";
import { SMS_CONSENT_FULL_TEXT } from "@/lib/lead-consent";

export const metadata: Metadata = {
  title: "Request Service | HVAC Revenue Boost",
  description:
    "Request HVAC, plumbing, or electrical service. Full intake with ZIP or city; SMS consent required. Same leads route powers Twilio admin alerts and opt-in acknowledgements.",
};

export default function RequestServicePage() {
  return (
    <section className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-[520px]">
        <nav className="mb-6 text-sm text-slate-600" aria-label="Breadcrumb">
          <Link href="/" className="text-blue-700 underline hover:text-blue-900">
            Home
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="font-medium text-slate-800">Request service</span>
        </nav>

        <h1 className="mb-3 text-3xl font-black tracking-tight text-hvac-navy">Request service</h1>
        <p className="mb-2 text-sm leading-relaxed text-slate-600">
          Choose the trade below, then submit. SMS is only sent with your checkbox consent. Opt-in wording matches our
          privacy policy:
        </p>
        <p className="mb-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-snug text-slate-700">
          {SMS_CONSENT_FULL_TEXT}
        </p>
        <p className="mb-2 text-sm leading-relaxed text-slate-600">
          You can also open the help modal from any guide page for the same flow.
        </p>
        <p className="mb-6 text-xs text-slate-500">
          Tip: bookmark or share a direct link, e.g.{" "}
          <Link
            className="text-blue-700 underline hover:text-blue-900"
            href="/request-service?profile=hvac_cooling"
          >
            /request-service?profile=hvac_cooling
          </Link>
          .
        </p>

        <RequestServiceClient />
      </div>
    </section>
  );
}
