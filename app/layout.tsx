import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import MobileStickyCallButton from "@/components/MobileStickyCallButton";
import LeadCaptureModal from "@/components/LeadCaptureModal";

const RV_DIAGNOSTICS_URL = "https://decisiongrid.com";

export const metadata: Metadata = {
  title: "HVAC Diagnostic Authority | Professional Repair Manual",
  description: "Diagnose your home HVAC system with our expert-led residential repair manual. Step-by-step guides for central AC, furnaces, and heat pumps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans min-h-screen bg-slate-50 text-slate-900"
        suppressHydrationWarning
      >
        <header className="bg-hvac-navy text-white py-4 shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <span className="bg-hvac-gold text-hvac-navy px-2 py-1 rounded">HVAC</span>
              <span>DIAGNOSTIC</span>
            </Link>
            <nav
              className="flex flex-wrap justify-end gap-x-4 sm:gap-x-6 gap-y-2 text-sm sm:text-base font-medium items-center max-w-[min(100%,42rem)]"
              aria-label="Primary"
            >
              <Link href="/" className="hover:text-hvac-gold transition-colors whitespace-nowrap">
                Home
              </Link>
              <span className="text-slate-500 hidden sm:inline" aria-hidden>
                |
              </span>
              <Link href="/hvac" className="hover:text-hvac-gold transition-colors whitespace-nowrap">
                HVAC
              </Link>
              <Link href="/plumbing" className="hover:text-hvac-gold transition-colors whitespace-nowrap">
                Plumbing
              </Link>
              <Link href="/electrical" className="hover:text-hvac-gold transition-colors whitespace-nowrap">
                Electrical
              </Link>
              <Link href="/roofing" className="hover:text-hvac-gold transition-colors whitespace-nowrap">
                Roofing
              </Link>
              <span className="text-slate-500 hidden sm:inline" aria-hidden>
                |
              </span>
              <a
                href={RV_DIAGNOSTICS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-300 hover:text-hvac-gold transition-colors whitespace-nowrap border border-slate-600/80 rounded-md px-2 py-0.5 sm:border-0 sm:px-0 sm:py-0"
              >
                <span>RV Diagnostics</span>
                <span className="text-hvac-gold text-xs font-bold" aria-hidden>
                  ↗
                </span>
                <span className="sr-only">(opens in new tab, external site)</span>
              </a>
            </nav>
          </div>
        </header>
        <main className="min-h-screen bg-slate-50">
          {children}
        </main>
        <footer className="bg-slate-900 text-slate-400 py-12 mt-20 border-t border-slate-800">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="text-white font-bold mb-4">HVAC Diagnostic Engine</h4>
                <p className="text-sm">Scalable residential HVAC authority site powered by deterministic knowledge graphs.</p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">Quick Links</h4>
                <ul className="text-sm space-y-2">
                  <li><Link href="/diagnose" className="hover:text-white">Diagnose Problems</Link></li>
                  <li><Link href="/repair" className="hover:text-white">Find Technicians</Link></li>
                  <li><Link href="/appliance-repair" className="hover:text-white">Appliance repair</Link></li>
                  <li><Link href="/mold-remediation" className="hover:text-white">Mold remediation</Link></li>
                </ul>
              </div>
              <div className="md:col-span-2 lg:col-span-2 rounded-xl border border-slate-700/60 bg-slate-800/30 p-5 lg:p-6">
                <h4 className="text-slate-200 font-bold mb-2 text-sm uppercase tracking-wide">
                  RV System Diagnostics
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 max-w-xl">
                  Diagnosing an RV AC, electrical, or water system? Visit our dedicated RV diagnostic platform designed
                  specifically for mobile systems.
                </p>
                <a
                  href={RV_DIAGNOSTICS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-hvac-gold transition-colors"
                >
                  Go to RV Diagnostics
                  <span className="text-hvac-gold" aria-hidden>
                    ↗
                  </span>
                  <span className="sr-only">(opens in new tab, external site)</span>
                </a>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 flex flex-col items-center text-xs text-center">
              <div className="flex gap-6 mb-4">
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              </div>
              <p>&copy; {new Date().getFullYear()} HVAC Revenue Boost. All rights reserved.</p>
              <p className="mt-2 text-slate-500">HVAC Revenue Boost is operated by AH Operations Group</p>
            </div>
          </div>
        </footer>
        <MobileStickyCallButton />
        <LeadCaptureModal />
      </body>
    </html>
  );
}
