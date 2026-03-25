import { DiagnosticData } from "@/types/diagnostic";

export default function DeepDive({
  causes,
}: {
  causes: DiagnosticData["deep_causes"];
}) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4">Detailed Causes & Fixes</h2>

      {causes.map((c, i) => (
        <div key={i} className="mb-6">
          <h3 className="font-bold text-lg">{c.cause}</h3>

          <p className="mb-2">{c.why_it_happens}</p>

          <ul className="list-disc pl-5">
            {c.fix_steps.map((step, j) => (
              <li key={j}>{step}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
