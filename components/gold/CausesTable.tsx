import { DiagnosticData } from "@/types/diagnostic";

export default function CausesTable({
  causes,
}: {
  causes: DiagnosticData["causes"];
}) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4">Most Common Causes</h2>

      <table className="w-full border">
        <thead>
          <tr>
            <th className="border p-2">Cause</th>
            <th className="border p-2">Probability</th>
            <th className="border p-2">Fix</th>
          </tr>
        </thead>
        <tbody>
          {causes.map((c, i) => (
            <tr key={i}>
              <td className="border p-2">{c.name}</td>
              <td className="border p-2">{c.probability}</td>
              <td className="border p-2">{c.quick_fix}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
