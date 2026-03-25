import { DiagnosticData } from "@/types/diagnostic";

export default function DeepDive({
  causes,
}: {
  causes: DiagnosticData["deep_causes"];
}) {
  return (
    <section className="mb-10">
      <div className="text-sm text-slate-500 mb-4 font-bold tracking-widest uppercase">
        Detailed breakdown of each failure point:
      </div>
      <div className="space-y-6">
        {(causes || []).map((cause, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
          >
            <h3 className="text-xl font-black text-slate-900 mb-2">
              {cause.cause}
            </h3>

            <p className="text-slate-600 leading-relaxed font-medium mb-4">
              {cause.why_it_happens}
            </p>

            <div className="space-y-3 mt-5 pt-5 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase text-hvac-blue tracking-wider mb-2">Diagnostic Protocol</h4>
              {(cause.fix_steps || []).map((step, j) => (
                <div key={j} className="flex gap-3 text-sm text-slate-700 font-semibold items-start">
                  <span className="text-hvac-blue mt-0.5">✔</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            {cause.tools_needed && Array.isArray(cause.tools_needed) && cause.tools_needed.length > 0 && (
              <div className="space-y-2 mt-5 pt-5 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Required Tools</h4>
                <div className="flex flex-wrap gap-2 text-xs text-slate-600 font-bold">
                   {(cause.tools_needed || []).map((t, k) => <span key={k} className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">{t}</span>)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
