import { SYSTEM_HUBS } from "@/lib/system-hubs";
import { getConditionsForPillar } from "@/lib/conditions";
import { getCitiesByState } from "@/lib/locations";
import Link from "next/link";

export default function Home() {
  const statesWithCities = getCitiesByState();

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
              <Link href="/hvac" className="btn-primary px-10 py-4 bg-hvac-blue/20 text-white hover:bg-hvac-blue/30 font-bold text-lg border-2 border-white/50">
                HVAC PILLARS
              </Link>
              <Link href="/hub/home-ac" className="btn-primary px-10 py-4 bg-hvac-blue/10 text-white hover:bg-hvac-blue/20 font-bold text-lg border-2 border-white/30">
                DIAGNOSTIC HUBS
              </Link>
            </div>
          </div>
        </div>
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

      {/* HVAC Pillar System — Authoritative Guides */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="mt-0">HVAC System Pillars</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Navigate by system domain. Each pillar links to an authoritative guide with problem clusters and condition variations.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SYSTEM_HUBS.map((hub) => {
            const conditions = getConditionsForPillar(hub.slug);
            return (
              <div key={hub.slug} className="manual-card">
                <Link href={`/${hub.slug}`} className="block group">
                  <h3 className="group-hover:text-hvac-gold transition-colors mb-2">{hub.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{hub.description}</p>
                  <span className="text-hvac-blue font-bold text-xs uppercase tracking-widest">
                    Authoritative Guide →
                  </span>
                </Link>
                {conditions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Conditions ({conditions.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {conditions.slice(0, 4).map((c) => (
                        <Link
                          key={c.slug}
                          href={`/conditions/${c.slug}`}
                          className="text-xs text-hvac-blue hover:underline"
                        >
                          {c.name}
                        </Link>
                      ))}
                      {conditions.length > 4 && (
                        <Link href={`/${hub.slug}`} className="text-xs text-slate-500 hover:text-hvac-blue">
                          +{conditions.length - 4} more
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Florida Service Hubs — State column with sub-items */}
      <section className="bg-slate-50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center mb-4">Verified HVAC Service — Florida</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We currently serve Florida. Expert HVAC diagnostics and repair services. More states coming soon.
          </p>
          <div className="max-w-4xl mx-auto">
            {statesWithCities.map(({ state, stateName, cities }) => (
              <div key={state} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-hvac-navy text-white px-6 py-4 font-bold text-lg">
                  {stateName}
                </div>
                <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cities.slice(0, 12).map((city) => (
                    <div key={city.slug} className="border border-slate-100 rounded-lg p-4 hover:border-hvac-blue transition-colors">
                      <h4 className="font-bold text-hvac-navy mb-2">{city.name}</h4>
                      <div className="space-y-1.5">
                        <Link
                          href={`/repair/${city.slug}/ac-blowing-warm-air`}
                          className="block text-sm text-hvac-blue hover:underline"
                        >
                          AC Blowing Warm Air
                        </Link>
                        <Link
                          href={`/repair/${city.slug}/ac-not-turning-on`}
                          className="block text-sm text-hvac-blue hover:underline"
                        >
                          AC Not Turning On
                        </Link>
                        <Link
                          href={`/repair/${city.slug}/ice-on-outdoor-unit`}
                          className="block text-sm text-hvac-blue hover:underline"
                        >
                          Ice on Outdoor Unit
                        </Link>
                        <Link
                          href={`/repair/${city.slug}`}
                          className="block text-sm font-bold text-hvac-gold hover:underline mt-2"
                        >
                          All {city.name} Repairs →
                        </Link>
                      </div>
                    </div>
                  ))}
                  {cities.length > 12 && (
                    <div className="sm:col-span-2 lg:col-span-3 text-center py-4">
                      <Link href="/repair" className="text-hvac-blue font-bold hover:underline">
                        View all {cities.length} Florida cities →
                      </Link>
                    </div>
                  )}
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
            &quot;If you are troubleshooting an RV air conditioner instead of a home HVAC system, visit DecisionGrid for RV repair diagnostics.&quot;
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
