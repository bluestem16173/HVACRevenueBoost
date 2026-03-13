import Link from "next/link";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import ThirtySecondSummary from "@/components/ThirtySecondSummary";

export default function CausePageTemplate({ cause, symptom, repairs, component }: any) {
  const summaryPoints = [
    { label: "Technical Cause", value: cause.name },
    { label: "Associated Symptom", value: symptom?.name || "System Failure" },
    { label: "Failed Component", value: component?.name || "Multiple" },
    { label: "Repair Difficulty", value: cause.difficulty || "Intermediate" }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <nav className="text-sm text-gray-500 mb-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/diagnose/${symptom?.slug || ''}`} className="hover:text-hvac-blue">{symptom?.name || 'Diagnostic Hub'}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Why it happens</span>
      </nav>

      <section className="mb-12">
        <div className="inline-block bg-red-100 text-red-700 text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          Root Cause Analysis
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy leading-tight">
          {cause.name} - Symptoms & Technical Breakdown
        </h1>
      </section>

      <ThirtySecondSummary points={summaryPoints} />

      <section className="mb-16 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 shadow-sm leading-relaxed text-lg">
        <h2 className="mt-0 text-hvac-navy border-0">Technical Explanation</h2>
        <p className="mt-4">{cause.explanation}</p>
        <p className="mt-4 text-gray-600">
          When this fault path is triggered, it typically requires immediate attention to prevent cascading failures across the {component?.name || "system"}. Let's look at the standard repair pathways below.
        </p>
      </section>

      <section className="mt-24 pt-24 border-t border-slate-200">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-7">
            <h2 className="mt-0 text-3xl font-black border-0 leading-tight">Recommended Repairs</h2>
            <p className="text-gray-600 mt-4 leading-relaxed">
              Based on the detected root cause ({cause.name}), these are the standard protocol repairs.
            </p>
            <ul className="mt-8 space-y-4 list-none p-0">
              {repairs?.map((r: any, idx: number) => (
                <li key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-hvac-navy m-0">{r.name}</h4>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-gray-500">Cost Level: <strong className="text-hvac-navy uppercase tracking-widest">{r.repair_type || 'Variable'}</strong></span>
                    <Link href={`/fix/${r.slug}`} className="text-xs font-bold text-hvac-blue uppercase hover:underline">View Manual →</Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-5">
            <LeadCaptureForm />
          </div>
        </div>
      </section>
    </div>
  );
}
