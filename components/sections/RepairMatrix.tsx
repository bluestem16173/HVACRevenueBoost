export default function RepairMatrix({ data }: { data: any }) {
  const matrix = Array.isArray(data) ? data : [];
  if (matrix.length === 0) return null;
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Repair Difficulty Matrix</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="p-4 font-bold">Repair</th>
              <th className="p-4 font-bold">Difficulty</th>
              <th className="p-4 font-bold">Cost</th>
              <th className="p-4 font-bold">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {matrix.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-4 font-medium">{row.repair}</td>
                <td className="p-4">{row.difficulty}</td>
                <td className="p-4">{row.cost}</td>
                <td className="p-4">{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
