export default function Prevention({ data }: { data: any }) {
  const tips = Array.isArray(data) ? data : [];
  if (tips.length === 0) return null;
  return (
    <section className="mb-16" id="prevention">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Prevention Tips</h2>
      <ul className="grid sm:grid-cols-3 gap-6 list-none p-0">
        {tips.map((tip: string, idx: number) => (
          <li key={idx} className="text-center">
            <div className="w-12 h-12 bg-hvac-navy text-hvac-gold rounded-full flex items-center justify-center mx-auto mb-3 font-black text-xl">
              {idx + 1}
            </div>
            <span className="font-medium text-slate-800 dark:text-slate-200">{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
