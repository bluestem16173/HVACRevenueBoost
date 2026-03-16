export default function EnvironmentalFactors({ data }: { data: any }) {
  const factors = Array.isArray(data) ? data : [];
  if (factors.length === 0) return null;
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Environmental Factors</h2>
      <div className="space-y-4">
        {factors.map((f: string, idx: number) => (
          <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            {f}
          </div>
        ))}
      </div>
    </section>
  );
}
