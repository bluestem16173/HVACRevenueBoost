export default function Causes({ data }: { data: any }) {
  const causes = Array.isArray(data) ? data : data?.causes ?? [];
  if (causes.length === 0) return null;
  return (
    <section className="mb-16" id="common-causes">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">Common Causes</h2>
      <div className="space-y-6">
        {causes.map((c: any, idx: number) => (
          <div key={idx} className="border-l-4 border-hvac-blue pl-6">
            <h3 className="text-xl font-bold text-hvac-navy dark:text-white">{c.name}</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">{c.description}</p>
            {Array.isArray(c.indicators) && c.indicators.length > 0 && (
              <p className="text-sm text-slate-500 mt-2">
                <strong>Indicators:</strong> {c.indicators.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
