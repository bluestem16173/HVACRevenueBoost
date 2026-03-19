import { normalizeItems } from "@/lib/text-format";

export default function Tools({ data }: { data: any }) {
  const tools = normalizeItems(Array.isArray(data) ? data : []);
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Tools Required</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {tools.map((t: any, idx: number) => (
          <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="font-bold text-slate-700 dark:text-slate-300">{t.name}</div>
            <div className="text-xs text-slate-500 mt-1">{t.purpose ?? t.reason}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
