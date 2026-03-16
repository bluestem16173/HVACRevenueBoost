export default function Insights({ data }: { data: any }) {
  const insights = Array.isArray(data) ? data : [];
  if (insights.length === 0) return null;
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">Technician Insights</h2>
      <div className="grid sm:grid-cols-2 gap-6">
        {insights.slice(0, 2).map((text: string | { text?: string }, idx: number) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-xl border-l-4 border-l-hvac-blue">
            <p className="text-slate-700 dark:text-slate-300 italic m-0">
              &quot;{typeof text === "string" ? text : text?.text}&quot;
            </p>
            <p className="text-xs font-bold text-slate-500 mt-3 m-0">— Top Rated Local Techs</p>
          </div>
        ))}
      </div>
    </section>
  );
}
