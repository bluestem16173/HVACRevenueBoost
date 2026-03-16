import Link from "next/link";

export default function GuidedFilters({ data }: { data: any }) {
  if (!data) return null;
  const env = data.environment ?? [];
  const sym = data.symptoms ?? [];
  const noise = data.noise ?? [];
  if (env.length === 0 && sym.length === 0 && noise.length === 0) return null;
  const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
  return (
    <section className="mb-16" id="guided-diagnosis">
      <div className="bg-hvac-navy p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-black text-white mb-2">Guided Diagnosis Filters</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-4">
          {env.length > 0 && (
            <div className="bg-hvac-brown/30 p-5 rounded-xl">
              <h4 className="text-xs font-black text-hvac-gold uppercase tracking-widest mb-4">Environment</h4>
              <div className="flex flex-wrap gap-2">
                {env.map((o: string) => (
                  <Link key={o} href={`/conditions/${slug(o)}`} className="px-3 py-2 bg-hvac-brown/50 hover:bg-hvac-blue text-white text-sm font-bold rounded">
                    {o}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {sym.length > 0 && (
            <div className="bg-hvac-brown/30 p-5 rounded-xl">
              <h4 className="text-xs font-black text-hvac-gold uppercase tracking-widest mb-4">Conditions</h4>
              <div className="flex flex-wrap gap-2">
                {sym.map((o: string) => (
                  <Link key={o} href={`/conditions/${slug(o)}`} className="px-3 py-2 bg-hvac-brown/50 hover:bg-hvac-blue text-white text-sm font-bold rounded">
                    {o}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {noise.length > 0 && (
            <div className="bg-hvac-brown/30 p-5 rounded-xl">
              <h4 className="text-xs font-black text-hvac-gold uppercase tracking-widest mb-4">Noise(s)</h4>
              <div className="flex flex-wrap gap-2">
                {noise.map((o: string) => (
                  <Link key={o} href={`/conditions/${slug(o)}`} className="px-3 py-2 bg-hvac-brown/50 hover:bg-hvac-blue text-white text-sm font-bold rounded">
                    {o}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
