import type { Metadata } from "next";
import Link from "next/link";
import LeadCard from "@/components/LeadCard";

export const metadata: Metadata = {
  title: "Request HVAC Service | HVAC Revenue Boost",
  description:
    "Request HVAC service in your area. Same form as our site-wide help flow — inquiry, scheduling, and service coordination only.",
};

export default function RequestServicePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-[520px] mx-auto">
        <p className="text-sm text-slate-600 mb-4">
          <Link href="/" className="text-blue-700 underline hover:text-blue-900">
            Home
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-800 font-medium">Request service</span>
        </p>
        <LeadCard variant="standalone" serviceType="ac" issue="wont_turn_on" />
      </div>
    </main>
  );
}
