import type { Metadata } from "next";
import Link from "next/link";
import SmsConsentLeadForm from "@/components/SmsConsentLeadForm";

export const metadata: Metadata = {
  title: "Request HVAC Service | HVAC Revenue Boost",
  description:
    "Request HVAC service and receive SMS updates regarding your inquiry, scheduling, and service. Phone and optional name; explicit SMS consent required.",
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

        <h1 className="mb-3 text-3xl font-black tracking-tight text-hvac-navy">Request HVAC service</h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-600">
          Submit this form to request HVAC service and receive SMS updates regarding your inquiry, scheduling, and
          service. For a fuller intake (including ZIP or city), you can still open the help modal from any guide page.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
          <SmsConsentLeadForm
            variant="static"
            defaultSourcePage="/request-service"
            phoneFieldId="request-service-sms-phone"
          />
        </div>
      </div>
    </section>
  );
}
