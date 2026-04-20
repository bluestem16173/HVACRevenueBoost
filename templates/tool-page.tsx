import Link from "next/link";

import { SmsLegalFooterLinks } from "@/components/SmsLegalFooterLinks";
import ThirtySecondSummary from "@/components/ThirtySecondSummary";
import AmazonDisclosure from "@/components/AmazonDisclosure";

export default function ToolPageTemplate({ tool, repairs }: any) {
  const summaryPoints = [
    { label: "Diagnostic Tool", value: tool.name },
    { label: "Primary Use", value: "Troubleshooting & Calibration" },
    { label: "Supported Repairs", value: repairs?.length || "Multiple" },
    { label: "Requirement Level", value: "Mandatory" }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <nav className="text-sm text-gray-500 mb-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Diagnostic Tools</span>
      </nav>

      <section className="mb-12">
        <div className="inline-block bg-slate-800 text-white text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          HVAC Gear Profile
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy leading-tight">
          {tool.name} For HVAC Diagnostics
        </h1>
      </section>

      <ThirtySecondSummary points={summaryPoints} />

      <section className="mb-16 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 shadow-sm leading-relaxed text-lg">
        <h2 className="mt-0 text-hvac-navy border-0">What This Tool Does</h2>
        <p className="mt-4">{tool.description}</p>
        
        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 m-0">
            Professional diagnostic gear is highly recommended. Verify specifications on Amazon.
          </p>
          <a 
            href={tool.affiliate_link || `https://www.amazon.com/s?k=${encodeURIComponent('HVAC ' + tool.name)}&tag=decisiongrid2-20`}
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-8 py-3 rounded-lg uppercase tracking-widest text-sm transition-colors w-full sm:w-auto text-center shadow-sm"
          >
            Check Price on Amazon
          </a>
        </div>
        <AmazonDisclosure />
      </section>

      <section className="mt-24 pt-24 border-t border-slate-200">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-7">
            <h2 className="mt-0 text-3xl font-black border-0 leading-tight">Supported Repairs</h2>
            <p className="text-gray-600 mt-4 leading-relaxed">
              If you purchase a {tool.name}, you are equipped to perform the following technical repairs:
            </p>
            <ul className="mt-8 space-y-3 list-none p-0">
              {repairs?.map((r: any, idx: number) => (
                <li key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg flex justify-between items-center border border-slate-100">
                  <span className="font-bold text-hvac-navy">{r.name}</span>
                  <Link href={`/fix/${r.slug}`} className="text-[10px] font-black tracking-widest text-hvac-blue uppercase hover:text-hvac-navy">View Repair Guide</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-5">
            <div className="bg-hvac-navy text-white p-8 rounded-2xl text-center shadow-xl">
              <h3 className="text-2xl font-black mb-4 border-0">Ready for Professional Help?</h3>
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">Local licensed technicians can complete this repair safely and quickly.</p>
              <button data-open-lead-modal className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-6 py-3 rounded-xl uppercase tracking-widest text-sm transition-colors shadow-md w-full">
                Get HVAC Repair Quotes
              </button>
              <SmsLegalFooterLinks className="mt-3 justify-center text-[10px]" tone="onDark" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
