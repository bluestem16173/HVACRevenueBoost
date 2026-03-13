import { SYMPTOMS, CITIES } from "@/data/knowledge-graph";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-hvac-navy text-white pt-20 pb-32 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <span className="bg-hvac-gold text-hvac-navy px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest mb-6 inline-block">
              Professional HVAC Repair Manual
            </span>
            <h1 className="text-white lg:text-7xl mb-8 leading-tight">
              Diagnose HVAC Problems <span className="text-hvac-gold">Like a Pro</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              The national authority on residential HVAC diagnostics. Use our deterministic repair manuals to identify causes, find repairs, and connect with verified local technicians.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/diagnose" className="btn-primary px-10 py-4 bg-hvac-gold text-hvac-navy hover:bg-yellow-500 font-black text-xl">
                START DIAGNOSTIC
              </Link>
              <Link href="/repair" className="btn-primary px-10 py-4 bg-white text-hvac-navy hover:bg-slate-100 font-bold text-xl border-2 border-white">
                FIND LOCAL HELP
              </Link>
            </div>
          </div>
        </div>
        {/* Abstract Background pattern */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <div className="w-[800px] h-[800px] border-[50px] border-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="manual-card bg-white border-b-8 border-b-hvac-gold shadow-xl">
            <div className="text-4xl font-black text-hvac-navy mb-2">50,000+</div>
            <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Diagnostic Pages</div>
          </div>
          <div className="manual-card bg-white border-b-8 border-b-hvac-blue shadow-xl">
            <div className="text-4xl font-black text-hvac-navy mb-2">100%</div>
            <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Deterministic Logic</div>
          </div>
          <div className="manual-card bg-white border-b-8 border-b-hvac-navy shadow-xl">
            <div className="text-4xl font-black text-hvac-navy mb-2">Verified</div>
            <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Technician Network</div>
          </div>
        </div>
      </section>

      {/* Main Symptoms Grid */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="mt-0">Common HVAC Symptoms</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Select a symptom below to access the full technical diagnostic manual and repair paths.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SYMPTOMS.map((symptom) => (
            <Link 
              key={symptom.id} 
              href={`/diagnose/${symptom.id}`}
              className="manual-card hover:border-hvac-blue hover:-translate-y-1 group"
            >
              <h3 className="group-hover:text-hvac-gold transition-colors">{symptom.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{symptom.description}</p>
              <div className="mt-6 flex items-center gap-2 text-hvac-blue font-bold text-xs uppercase tracking-widest">
                Start Repair Guide <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Localized Repair Hubs */}
      <section className="bg-slate-50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center mb-16">Verified HVAC Service Hubs</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {CITIES.map((city) => (
              <div key={city.slug} className="manual-card bg-white">
                <h3 className="text-hvac-blue">{city.name}, {city.state}</h3>
                <p className="text-sm text-gray-500 mb-6">Expert HVAC diagnostics and repair services for the greater {city.name} area.</p>
                <div className="space-y-3">
                  {SYMPTOMS.slice(0, 3).map(s => (
                    <Link 
                      key={s.id} 
                      href={`/repair/${city.slug}/${s.id}`}
                      className="block text-sm text-hvac-navy hover:text-hvac-gold font-medium"
                    >
                      {s.name} Repair {city.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RV Cross-Link */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-xl mx-auto">
          <h4 className="font-bold text-hvac-navy mb-4">Troubleshooting an RV AC?</h4>
          <p className="text-gray-500 text-sm italic mb-6">
            "If you are troubleshooting an RV air conditioner instead of a home HVAC system, visit DecisionGrid for RV repair diagnostics."
          </p>
          <a 
            href="https://decisiongrid.com" 
            className="text-hvac-blue font-bold hover:underline"
          >
            Visit DecisionGrid.com RV Diagnostics
          </a>
        </div>
      </section>
    </div>
  );
}
