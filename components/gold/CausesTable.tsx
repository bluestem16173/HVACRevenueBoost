import { DiagnosticData } from "@/types/diagnostic";
import Link from "next/link";

export default function CausesTable({
  causes,
}: {
  causes: DiagnosticData["causes"];
}) {
  return (
    <section className="mb-10">
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700 uppercase text-xs font-black tracking-wider">
            <tr>
              <th className="p-4 text-left">Problem</th>
              <th className="p-4 text-left">Likely Cause</th>
              <th className="p-4 text-left">Fix</th>
              <th className="p-4 text-left">Probability</th>
            </tr>
          </thead>
          <tbody>
            {(causes || []).map((row, i) => (
              <tr
                key={i}
                className="border-t border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                <td className="p-4 font-medium text-slate-900 border-r border-slate-100">{row.description}</td>
                <td className="p-4 text-slate-700 border-r border-slate-100">
                  <Link href={`/causes/${row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="hover:text-hvac-blue hover:underline block font-bold">
                    {row.name}
                  </Link>
                </td>
                <td className="p-4 border-r border-slate-100">{row.quick_fix}</td>
                <td className="p-4 font-black">
                  <span className={
                    row.probability === "High"
                      ? "text-red-600"
                      : row.probability === "Medium"
                      ? "text-orange-500"
                      : "text-slate-500"
                  }>
                    {row.probability}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
