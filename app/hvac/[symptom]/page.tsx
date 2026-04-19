import Link from "next/link";
import { notFound } from "next/navigation";
import { DiagnosticPageView } from "@/components/DiagnosticPageView";
import { DiagnosticVerticalNav } from "@/components/diagnostic-hub/DiagnosticVerticalNav";
import { getIndexablePageBySlug } from "@/lib/get-indexable-page";
import { getSystemHub, getSymptomsForHub, SYSTEM_HUBS } from "@/lib/system-hubs";

/** DB-backed symptom pages: always read fresh `pages` rows (same DATABASE_URL as workers). */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

const SLUG_MAP: Record<string, string> = {
  "air-conditioning": "hvac-air-conditioning",
  "heating-systems": "hvac-heating-systems",
  "airflow-ductwork": "hvac-airflow-ductwork",
  "electrical-controls": "hvac-electrical-controls",
  "thermostats-controls": "hvac-thermostats-controls",
  "maintenance": "hvac-maintenance",
};

export async function generateStaticParams() {
  return Object.keys(SLUG_MAP).map((slug) => ({ symptom: slug }));
}

export default async function HvacSymptomOrHubPage({ params }: { params: { symptom: string } }) {
  const segment = params.symptom;

  if (SLUG_MAP[segment]) {
    const hubSlug = SLUG_MAP[segment];
    const hub = getSystemHub(hubSlug);
    if (!hub) notFound();
    const symptoms = getSymptomsForHub(hub);

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <nav className="mx-auto max-w-4xl px-4 py-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-hvac-blue">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/hvac" className="hover:text-hvac-blue">
            HVAC
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-900 dark:text-white">{hub.name}</span>
        </nav>

        <section className="mx-auto max-w-4xl px-4 py-12">
          <div className="mb-4 inline-block rounded-full bg-hvac-blue/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-hvac-blue">
            System Hub
          </div>
          <h1 className="mb-6 text-4xl font-black leading-tight text-hvac-navy dark:text-white md:text-5xl">{hub.name}</h1>
          <p className="mb-12 text-lg leading-relaxed text-gray-600 dark:text-slate-400">{hub.description}</p>

          <h2 className="mb-6 text-2xl font-bold text-hvac-navy dark:text-white">
            Common {hub.name.replace("HVAC ", "")} problems
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {symptoms.map((symptom: any) => (
              <Link
                key={symptom.id}
                href={`/hvac/${symptom.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-6 transition hover:border-hvac-blue hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <h3 className="mb-2 font-bold text-hvac-navy dark:text-white">{symptom.name}</h3>
                <p className="line-clamp-2 text-sm text-gray-500 dark:text-slate-400">{symptom.description}</p>
                <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-hvac-blue">
                  Diagnostic pillar →
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-16 border-t border-slate-200 pt-12 dark:border-slate-800">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">Other system hubs</h3>
            <div className="flex flex-wrap gap-3">
              {SYSTEM_HUBS.filter((h) => h.slug !== hub.slug).map((h) => {
                const shortSlug = Object.entries(SLUG_MAP).find(([, v]) => v === h.slug)?.[0] || h.slug;
                return (
                  <Link
                    key={h.slug}
                    href={`/hvac/${shortSlug}`}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-hvac-blue dark:border-slate-700 dark:bg-slate-900"
                  >
                    {h.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    );
  }

  let page = await getIndexablePageBySlug(`hvac/${segment}`);
  if (!page) page = await getIndexablePageBySlug(segment);
  if (!page) page = await getIndexablePageBySlug(`diagnose/${segment}`);
  if (page) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 pt-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-hvac-blue">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/hvac" className="hover:text-hvac-blue">
            HVAC
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {(page as { title?: string | null }).title || segment.replace(/-/g, " ")}
          </span>
        </nav>
        <p className="mx-auto max-w-4xl px-4 pb-2 text-xs text-slate-500">
          Localized guides: open your city from the{" "}
          <Link href="/hvac" className="text-hvac-blue hover:underline">
            HVAC hub
          </Link>{" "}
          or append <span className="font-mono">/{`{city}`}</span> to this URL.
        </p>
        <div className="mx-auto max-w-4xl px-4">
          <DiagnosticVerticalNav vertical="hvac" pillarSlug={segment} citySlug={null} />
        </div>
        <DiagnosticPageView page={page as any} localLabel={null} relatedVertical="hvac" />
      </div>
    );
  }

  notFound();
}
