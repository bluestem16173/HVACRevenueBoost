import Link from "next/link";
import { SmsLegalFooterLinks } from "@/components/SmsLegalFooterLinks";
import { getVertical, HOME_SERVICE_VERTICALS, normalizeVerticalId } from "@/lib/verticals";

export default function VerticalHub({ verticalId }: { verticalId: string }) {
  const v = getVertical(normalizeVerticalId(verticalId));
  const otherVerticals = Object.values(HOME_SERVICE_VERTICALS).filter((x) => x.id !== v.id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="max-w-4xl mx-auto px-4 py-4 text-sm text-gray-500 flex flex-wrap gap-2 items-center">
        <Link href="/" className="hover:text-hvac-blue">
          Home
        </Link>
        <span className="text-slate-300">/</span>
        <Link href="/hvac" className="hover:text-hvac-blue">
          HVAC
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{v.label}</span>
      </nav>

      <section id="pillars" className="max-w-4xl mx-auto px-4 pb-20">
        <div className="inline-block bg-hvac-blue/10 text-hvac-blue text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          Home Service Authority
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight mb-4">
          {v.label} diagnostic engine
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed mb-10 max-w-2xl">
          Same DecisionGrid-style playbook as HVAC: symptom pillars → causes → repairs → pro match. HVAC guides
          are live today; this vertical is scaffolded for programmatic expansion and queue-driven pages.
        </p>

        <h2 className="text-xl font-bold text-hvac-navy dark:text-white mb-4">Cluster roots (pillars)</h2>
        <ul className="grid sm:grid-cols-2 gap-3 mb-14">
          {v.pillarExamples.map((p) => (
            <li key={p.slug}>
              <Link
                href={p.href}
                className="block p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-hvac-blue transition-colors"
              >
                <span className="font-bold text-hvac-navy dark:text-white">{p.title}</span>
                <span className="block text-xs text-slate-500 mt-1 font-mono">{p.slug}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border border-hvac-gold/30 bg-hvac-navy/5 dark:bg-slate-900/60 p-6 mb-12">
          <h3 className="text-lg font-bold text-hvac-navy dark:text-white mt-0">Get matched with a pro</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Lead capture is shared site-wide. Open the form from any page via{" "}
            <span className="font-mono text-xs">data-open-lead-modal</span> triggers.
          </p>
          <button
            type="button"
            data-open-lead-modal
            className="inline-flex items-center justify-center rounded-xl bg-hvac-gold px-6 py-3 font-black text-hvac-navy uppercase tracking-wide text-sm shadow-md hover:bg-yellow-400 transition-colors"
          >
            Request local {v.label} help
          </button>
          <SmsLegalFooterLinks className="mt-3 text-[10px]" />
        </div>

        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Other verticals</h3>
        <div className="flex flex-wrap gap-2">
          {otherVerticals.map((x) => (
            <Link
              key={x.id}
              href={x.id === "hvac" ? "/hvac" : `/${x.id}`}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium hover:border-hvac-blue"
            >
              {x.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
