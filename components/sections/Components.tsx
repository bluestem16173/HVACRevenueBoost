export default function Components({ data }: { data: any }) {
  const comps = Array.isArray(data) ? data : [];
  if (comps.length === 0) return null;
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Components</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {comps.map((c: any, idx: number) => (
          <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="font-bold text-slate-700 dark:text-slate-300">{c.name}</div>
            <div className="text-xs text-slate-500 mt-1">{c.role ?? c.description}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
