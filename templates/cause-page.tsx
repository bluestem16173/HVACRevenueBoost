import Link from "next/link";

import ThirtySecondSummary from "@/components/ThirtySecondSummary";

export default function CausePageTemplate({
  cause,
  symptom,
  repairs,
  component,
  diagnosticTests,
  htmlContent,
}: any) {
  const summaryPoints = [
    { label: "Technical Cause", value: cause.name },
    { label: "Associated Symptom", value: symptom?.name || "System Failure" },
    { label: "Failed Component", value: component?.name || "Multiple" },
    { label: "Repair Difficulty", value: cause.difficulty || "Intermediate" },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <nav className="text-sm text-gray-500 mb-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/hvac" className="hover:text-hvac-blue">HVAC Systems</Link>
        <span className="mx-2">/</span>
        <Link href="/diagnose" className="hover:text-hvac-blue">Diagnostics</Link>
        <span className="mx-2">/</span>
        <Link href={`/diagnose/${symptom?.slug || ""}`} className="hover:text-hvac-blue">
          {symptom?.name || "Symptom"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">Root Cause</span>
      </nav>

      <section className="mb-12">
        <div className="inline-block bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          Root Cause Analysis
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight">
          {cause.name} – Symptoms & Technical Breakdown
        </h1>
      </section>

      {htmlContent ? (
        <div className="prose max-w-none w-full" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      ) : (
        <>
          <ThirtySecondSummary points={summaryPoints} />

      <section className="mb-16 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm leading-relaxed text-lg">
        <h2 className="mt-0 text-hvac-navy dark:text-white border-0">Technical Explanation</h2>
        <p className="mt-4">{cause.explanation || cause.description}</p>
        <p className="mt-4 text-gray-600 dark:text-slate-400">
          When this fault path is triggered, it typically requires immediate attention to prevent cascading failures
          across the {component?.name || "system"}. Follow the diagnostic tests below to verify, then proceed to repair
          options.
        </p>
      </section>

      {/* Diagnostic Tests (Technician Workflow) */}
      {diagnosticTests?.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-2 border-0">
            Diagnostic Tests
          </h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            Technician verification procedures to confirm this cause before repair.
          </p>
          <div className="space-y-6">
            {diagnosticTests.map((test: any, idx: number) => (
              <div
                key={test.id || idx}
                className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                <h3 className="text-lg font-bold text-hvac-navy dark:text-white m-0 mb-2">
                  {test.name}
                </h3>
                {test.description && (
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 m-0">{test.description}</p>
                )}
                {test.test_steps && Array.isArray(test.test_steps) && (
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    {test.test_steps.map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                )}
                {test.tools_required && test.tools_required.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tools required:
                    </span>
                    <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                      {test.tools_required.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Repair Options */}
      <section className="mt-16 pt-16 border-t border-slate-200 dark:border-slate-800">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-7">
            <h2 className="mt-0 text-3xl font-black text-hvac-navy dark:text-white border-0 leading-tight">
              Repair Options
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mt-4 leading-relaxed">
              Based on the detected root cause ({cause.name}), these are the standard protocol repairs.
            </p>
            <ul className="mt-8 space-y-4 list-none p-0">
              {repairs?.map((r: any, idx: number) => (
                <li
                  key={r.id || idx}
                  className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <h4 className="font-bold text-hvac-navy dark:text-white m-0">{r.name}</h4>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      Difficulty:{" "}
                      <strong className="text-hvac-navy dark:text-white uppercase tracking-widest">
                        {r.skill_level || r.repair_type || "Variable"}
                      </strong>
                    </span>
                    <Link
                      href={`/fix/${r.slug}`}
                      className="text-xs font-bold text-hvac-blue uppercase hover:underline"
                    >
                      View Manual →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            {(!repairs || repairs.length === 0) && (
              <p className="text-slate-500 dark:text-slate-400 italic mt-4">
                No repairs mapped for this cause. Professional diagnostic recommended.
              </p>
            )}
          </div>
          <div className="md:col-span-5 space-y-6">
            <Link
              href="/repair"
              className="block p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:border-hvac-blue transition-colors"
            >
              <span className="font-bold text-hvac-navy dark:text-white">All Repair Guides</span>
              <span className="block text-xs text-gray-500 mt-1">→ /repair</span>
            </Link>
            <div className="bg-hvac-navy text-white p-8 rounded-2xl text-center shadow-xl">
              <h3 className="text-2xl font-black mb-4 border-0 text-white">
                Need Professional Assistance?
              </h3>
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                Don&apos;t guess on expensive control boards and compressors. Have a certified technician run
                diagnostic tests.
              </p>
              <button
                data-open-lead-modal
                className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-6 py-3 rounded-xl uppercase tracking-widest text-sm transition-colors shadow-md w-full"
              >
                Get HVAC Repair Quotes
              </button>
            </div>
          </div>
        </div>
      </section>
      </>
      )}
    </div>
  );
}

