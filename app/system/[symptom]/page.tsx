import { notFound } from "next/navigation";
import Link from "next/link";
import sql from "@/lib/db";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const rows = await sql`SELECT slug FROM systems LIMIT 50`;
    return (rows as any[]).map((r) => ({ symptom: r.slug }));
  } catch {
    return [
      { symptom: "residential-ac" },
      { symptom: "rv-ac" },
      { symptom: "mini-split" },
      { symptom: "rooftop-hvac" },
    ];
  }
}

export default async function SystemPage({ params }: { params: { symptom: string } }) {
  const res = await sql`
    SELECT id, name, slug, description FROM systems WHERE slug = ${params.symptom} LIMIT 1
  `;

  if (!(res as any[]).length) {
    notFound();
  }

  const system = (res as any[])[0];

  const symptoms = await sql`
    SELECT s.slug, s.name FROM symptoms s
    WHERE s.system_id = ${system.id}
    ORDER BY s.name
    LIMIT 30
  `;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <nav className="text-sm text-slate-500 mb-8">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/hvac" className="hover:text-hvac-blue">HVAC Systems</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 dark:text-white font-medium">{system.name}</span>
      </nav>

      <h1 className="text-4xl font-black text-hvac-navy dark:text-white mb-4">
        {system.name}
      </h1>
      {system.description && (
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">{system.description}</p>
      )}

      <h2 className="text-xl font-bold text-hvac-navy dark:text-white mb-4">
        Common Symptoms
      </h2>
      <ul className="grid sm:grid-cols-2 gap-3">
        {(symptoms as any[]).map((s) => (
          <li key={s.slug}>
            <Link
              href={`/diagnose/${s.slug}`}
              className="block p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-hvac-blue hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
            >
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
