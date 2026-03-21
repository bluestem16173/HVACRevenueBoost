import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import MobileStickyCallButton from "@/components/MobileStickyCallButton";
import LeadCaptureModal from "@/components/LeadCaptureModal";

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
    <html lang="en">
      <body className="font-sans min-h-screen bg-slate-50 text-slate-900">
        <header className="bg-hvac-navy text-white py-4 shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <span className="bg-hvac-gold text-hvac-navy px-2 py-1 rounded">HVAC</span>
              <span>DIAGNOSTIC</span>
            </Link>
            <nav className="hidden md:flex gap-6 font-medium">
              <Link href="/hvac" className="hover:text-hvac-gold transition-colors">HVAC Systems</Link>
              <Link href="/diagnose" className="hover:text-hvac-gold transition-colors">Diagnostics</Link>
              <Link href="/repair" className="hover:text-hvac-gold transition-colors">Repair Guides</Link>
            </nav>
            <div className="md:hidden">
              {/* Mobile menu would go here */}
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-slate-50">
          {children}
        </main>
        <footer className="bg-slate-900 text-slate-400 py-12 mt-20 border-t border-slate-800">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="text-white font-bold mb-4">HVAC Diagnostic Engine</h4>
                <p className="text-sm">Scalable residential HVAC authority site powered by deterministic knowledge graphs.</p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">Quick Links</h4>
                <ul className="text-sm space-y-2">
                  <li><Link href="/diagnose" className="hover:text-white">Diagnose Problems</Link></li>
                  <li><Link href="/repair" className="hover:text-white">Find Technicians</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">RV Repair</h4>
                <p className="text-sm italic">
                  Looking for RV HVAC repair? Visit <a href="https://decisiongrid.com" className="text-hvac-gold hover:underline">DecisionGrid</a> for specialized RV diagnostics.
                </p>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 text-xs text-center">
              &copy; {new Date().getFullYear()} HVAC Revenue Boost. All rights reserved.
            </div>
          </div>
        </footer>
        <MobileStickyCallButton />
        <LeadCaptureModal />
      </body>
    </html>
  );
}
