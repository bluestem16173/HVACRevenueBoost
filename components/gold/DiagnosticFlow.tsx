import Mermaid from "../Mermaid";

export default function DiagnosticFlow({ data }: { data: string | { chart: string, steps?: { step: string, detail: string }[] } }) {
  const chart = typeof data === "string" ? data : data?.chart;
  const steps = typeof data === "object" ? data?.steps : [];

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-4 text-hvac-navy">Diagnostic Flow</h2>
      <div className="mb-8">
        <Mermaid chart={chart} />
      </div>

      {steps && steps.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold mb-4">Step-by-Step Diagnostic Instructions</h3>
          {steps.map((s, i) => (
            <div key={i} className="p-5 bg-slate-50 border-l-4 border-hvac-blue rounded-r-lg shadow-sm">
              <h4 className="font-bold text-lg mb-2 text-hvac-navy">{s.step}</h4>
              <p className="text-slate-700 leading-relaxed font-medium">{s.detail}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
