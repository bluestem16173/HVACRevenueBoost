import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import Link from "next/link";
import MobileStickyCallButton from "@/components/MobileStickyCallButton";
import LeadCaptureModal from "@/components/LeadCaptureModal";
import DiagnosticModal from "@/components/DiagnosticModal";
import StickySmsLeadCta from "@/components/StickySmsLeadCta";
import { SITE_ORIGIN } from "@/lib/seo/canonical";
import { isStrictIndexingEnabled, strictDefaultRobotsForPathname } from "@/lib/seo/strict-indexing";

const RV_DIAGNOSTICS_URL = "https://www.decisiongrid.co";

const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: "Home Service Diagnostics | HVAC, Plumbing & Electrical",
  description:
    "Diagnose home HVAC, plumbing, and electrical problems with structured guides — then fix it yourself or get matched with a local pro.",
};

export async function generateMetadata(): Promise<Metadata> {
  if (!isStrictIndexingEnabled()) {
    return defaultMetadata;
  }
  const pathname = (await headers()).get("x-pathname") || "/";
  return {
    ...defaultMetadata,
    robots: strictDefaultRobotsForPathname(pathname),
  };
}

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
            <Link href="/" className="flex min-w-0 max-w-[55vw] items-center gap-2 sm:max-w-none">
              <span className="shrink-0 rounded bg-hvac-gold px-2 py-1 text-[10px] font-black uppercase leading-none text-hvac-navy sm:text-xs">
                HSD
              </span>
              <span className="truncate text-base font-black leading-tight tracking-tight sm:text-xl">
                <span className="text-white">Home Service </span>
                <span className="text-hvac-gold">Diagnostics</span>
              </span>
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
                <h4 className="text-white font-bold mb-4">Home Service Diagnostic Engine</h4>
                <p className="text-sm">
                  Structured diagnostics for residential systems — built to mirror how pros troubleshoot in the field.
                </p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">Quick Links</h4>
                <ul className="text-sm space-y-2">
                  <li>
                    <Link href="/diagnose" className="hover:text-white">
                      Diagnose Problems
                    </Link>
                  </li>
                  <li>
                    <Link href="/repair" className="hover:text-white">
                      Find Local Help
                    </Link>
                  </li>
                  <li>
                    <Link href="/hvac" className="hover:text-white">
                      HVAC
                    </Link>
                  </li>
                  <li>
                    <Link href="/plumbing" className="hover:text-white">
                      Plumbing
                    </Link>
                  </li>
                  <li>
                    <Link href="/electrical" className="hover:text-white">
                      Electrical
                    </Link>
                  </li>
                  <li>
                    <Link href="/roofing" className="hover:text-white">
                      Roofing
                    </Link>
                  </li>
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
        {/* Twilio A2P: fixed bottom SMS consent + phone (see StickySmsLeadCta / lib/lead-consent) */}
        <StickySmsLeadCta />
        <DiagnosticModal />
        <MobileStickyCallButton />
        <LeadCaptureModal />
      </body>
    </html>
  );
}
