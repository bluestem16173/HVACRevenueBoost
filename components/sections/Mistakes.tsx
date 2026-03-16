export default function Mistakes({ data }: { data: any }) {
  const mistakes = Array.isArray(data) ? data : [];
  if (mistakes.length === 0) return null;
  return (
    <section className="mb-16" id="common-mistakes">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Common DIY Mistakes</h2>
      <ul className="space-y-4 list-none p-0">
        {mistakes.map((m: string, idx: number) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="text-hvac-safety font-black mt-1">✗</span>
            <span className="text-slate-700 dark:text-slate-300">{m}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
