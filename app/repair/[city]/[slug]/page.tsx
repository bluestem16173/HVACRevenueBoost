import { SYMPTOMS, CAUSES, CITIES } from "@/data/knowledge-graph";
import { getDiagnosticSteps, getCauseDetails } from "@/lib/diagnostic-engine";
import { getRelatedContent } from "@/lib/seo-linking";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const params = [];
  for (const city of CITIES) {
    for (const symptom of SYMPTOMS) {
      params.push({
        city: city.slug,
        slug: symptom.id,
      });
    }
  }
  return params;
}

export default function CityRepairPage({ params }: { params: { city: string; slug: string } }) {
  const city = CITIES.find((c) => c.slug === params.city);
  const symptom = SYMPTOMS.find((s) => s.id === params.slug);

  if (!city || !symptom) {
    notFound();
  }

  const diagnosticSteps = getDiagnosticSteps(symptom.causes);
  const related = getRelatedContent(symptom);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <nav className="text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/repair" className="hover:text-hvac-blue">Local Repair</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{city.name} {symptom.name}</span>
      </nav>

      <section className="mb-16">
        <span className="bg-hvac-gold text-hvac-navy px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">
          Local Service: {city.name}, {city.state}
        </span>
        <h1>HVAC Repair in {city.name}: {symptom.name} Troubleshooting</h1>
        <p className="text-xl text-gray-600 mt-4 leading-relaxed">
          Need immediate HVAC repair in {city.name}? Our local experts specialize in diagnosing systems that are {symptom.name.toLowerCase()}. 
          We offer 24/7 emergency service and professional diagnostics for {city.name} homeowners.
        </p>
      </section>

      {/* Reusing the diagnostic content but with city context */}
      <section className="mb-16">
        <div className="manual-card border-l-4 border-hvac-blue">
          <h2 className="mt-0 text-hvac-navy">Professional {city.name} HVAC Inspection</h2>
          <p>
            Local conditions in {city.name}, {city.state} can put extra strain on residential HVAC systems. 
            High heat and humidity often lead to common failures like <strong>{CAUSES[symptom.causes[0]]?.name}</strong>.
          </p>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Expert Troubleshooting Guide</h2>
        <ol className="cause-list">
          {symptom.causes.map((causeId) => {
            const cause = getCauseDetails(causeId);
            if (!cause) return null;
            return (
              <li key={cause.id}>
                <h3>{cause.name}</h3>
                <p className="mt-2 text-gray-600">{cause.explanation}</p>
                <div className="mt-4">
                  <span className="text-xs font-bold uppercase text-gray-400">Recommended Repair for {city.name} Residents</span>
                  <ul className="repair-list">
                    {cause.repairDetails.map((repair) => (
                      <li key={repair.id} className="text-hvac-blue">
                        {repair.name} Specialists Available
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="bg-slate-900 text-white rounded-2xl p-8 mb-16 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-white mt-0 text-3xl">Get HVAC Repair in {city.name} Today</h2>
            <p className="text-slate-300">
              Don&apos;t wait for your system to fail completely. Our {city.name} response team can be at your door in less than 2 hours for urgent {symptom.name} calls.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <div className="flex items-center gap-2">
                <span className="text-hvac-gold">✓</span> Verified Technicians
              </div>
              <div className="flex items-center gap-2">
                <span className="text-hvac-gold">✓</span> Local {city.name} Experts
              </div>
              <div className="flex items-center gap-2">
                <span className="text-hvac-gold">✓</span> 5-Star Service
              </div>
            </div>
          </div>
          <LeadCaptureForm />
        </div>
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-hvac-blue/20 rounded-full blur-3xl"></div>
      </div>

      <section className="mb-16">
        <h2>Nearby Technical Resources</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {CITIES.filter(c => c.slug !== city.slug).map(c => (
            <Link 
              key={c.slug} 
              href={`/repair/${c.slug}/${symptom.id}`}
              className="p-4 bg-slate-50 border border-slate-200 rounded text-sm text-center font-medium hover:bg-white hover:border-hvac-blue transition-all"
            >
              Diagnostic Help in {c.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
