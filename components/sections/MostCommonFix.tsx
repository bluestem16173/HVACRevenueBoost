export default function MostCommonFix({ data }: { data: any }) {
  if (!data?.title) return null;
  const steps = data.steps || [];
  return (
    <section className="mb-12" id="common-fix">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Most Common Fix</h2>
      <div className="bg-white dark:bg-slate-900 border-2 border-green-500 dark:border-green-600 p-6 rounded-xl shadow-md">
        <h3 className="text-2xl font-black text-hvac-navy dark:text-white m-0">{data.title}</h3>
        {steps.length > 0 && (
          <ul className="mt-4 space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            {steps.map((step: string, i: number) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex gap-4 text-sm">
          <span className="font-bold text-slate-500">Cost:</span>
          <span className="font-black text-hvac-navy dark:text-white">{data.estimated_cost ?? "—"}</span>
          <span className="font-bold text-slate-500 ml-4">Difficulty:</span>
          <span className="font-black text-green-600 dark:text-green-400">{data.difficulty ?? "—"}</span>
        </div>
      </div>
    </section>
  );
}
