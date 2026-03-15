import { notFound } from "next/navigation";
import sql from "@/lib/db";
import DiagnosticWizard from "@/components/DiagnosticWizard";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const diags = await sql`SELECT slug FROM diagnostics LIMIT 50`;
    return (diags as any[]).map((d) => ({ slug: d.slug }));
  } catch {
    return [];
  }
}

export default async function DiagnosticPage({ params }: { params: { slug: string } }) {
  const res = await sql`
    SELECT id, name, slug, description FROM diagnostics WHERE slug = ${params.slug} LIMIT 1
  `;

  if (!(res as any[]).length) {
    notFound();
  }

  const diagnostic = (res as any[])[0];

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-black text-hvac-navy dark:text-white mb-2">
        {diagnostic.name}
      </h1>
      {diagnostic.description && (
        <p className="text-slate-600 dark:text-slate-400 mb-8">{diagnostic.description}</p>
      )}
      <DiagnosticWizard diagnosticSlug={diagnostic.slug} />
    </div>
  );
}
