import { DiagnosticData } from "@/types/diagnostic";

export default function AISummary({
  data,
}: {
  data: DiagnosticData["ai_summary"];
}) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4">Quick Answer</h2>

      <ul className="list-disc pl-5 space-y-2">
        {data.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>

      <p className="mt-4 font-semibold">
        Most Likely Issue: {data.most_likely_issue}
      </p>
    </section>
  );
}
