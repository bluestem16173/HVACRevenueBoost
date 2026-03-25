import { DiagnosticData } from "@/types/diagnostic";

export default function AISummary({
  data,
}: {
  data: DiagnosticData["ai_summary"];
}) {
  return (
    <section className="mb-4 mt-6">
      <div className="bg-slate-50 border-l-4 border-hvac-blue rounded-r-xl p-6 shadow-sm">
        <div className="text-xs font-black tracking-widest uppercase text-hvac-blue mb-2">
          Fast Answer
        </div>

        <p className="text-lg font-semibold text-slate-900 mb-3">
          Your system is most likely exhibiting issues due to:
        </p>

        <div className="flex items-center gap-2 text-red-600 font-bold text-base mb-4">
          ⚠️ {data.most_likely_issue}
        </div>

        <ul className="space-y-2 text-slate-700">
          {(data.bullets || []).map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-hvac-blue">•</span>
              <span className="font-medium">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 text-sm text-slate-600 font-bold ml-2">
        Want to confirm in 30 seconds? Follow the checklist below.
      </div>
    </section>
  );
}
