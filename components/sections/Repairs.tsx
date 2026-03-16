import Link from "next/link";
import { normalizeToString } from "@/lib/utils";

export default function Repairs({ data }: { data: any }) {
  const repairs = Array.isArray(data) ? data : data?.repairs ?? [];
  if (repairs.length === 0) return null;
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Repairs</h2>
      <div className="space-y-4">
        {repairs.map((r: any, idx: number) => (
          <Link
            key={idx}
            href={`/fix/${r.slug || normalizeToString(r.name).toLowerCase().replace(/\s+/g, "-")}`}
            className="block p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-hvac-blue"
          >
            <span className="font-bold text-slate-800 dark:text-slate-200">{normalizeToString(r.name)}</span>
            <span className="ml-2 text-sm text-slate-500">
              {normalizeToString(r.difficulty)} · {r.estimated_cost ?? r.cost}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
