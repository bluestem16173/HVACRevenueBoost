export function HubHero({
  title,
  description,
  badgeText,
  primaryCTA,
  secondaryCTA,
  theme = "residential"
}: {
  title: string;
  description: string;
  badgeText?: string;
  primaryCTA?: { label: string; href: string };
  secondaryCTA?: { label: string; href: string };
  theme?: "residential" | "commercial"
}) {
  const isCommercial = theme === "commercial";
  const bgClass = isCommercial 
    ? "bg-slate-900" 
    : "bg-hvac-navy relative overflow-hidden";

  return (
    <section className={`${bgClass} text-white pt-24 pb-32 md:pt-32 md:pb-40 relative border-b border-slate-800`}>
      {/* Background Decorators */}
      {theme === "residential" && (
        <>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_50%)] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent_40%)] pointer-events-none"></div>
        </>
      )}
      {theme === "commercial" && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      )}

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="max-w-4xl text-center mx-auto">
          {badgeText && (
            <div className={`inline-block border px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 ${
              isCommercial 
                ? "border-slate-700 bg-slate-800/80 text-slate-300"
                : "border-blue-500/30 bg-blue-500/10 text-blue-200"
            }`}>
              {badgeText}
            </div>
          )}
          
          <h1 className="text-white drop-shadow-lg text-5xl md:text-7xl lg:text-8xl font-black leading-none mb-6 tracking-tight">
            {title}
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-10 font-light">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {primaryCTA && (
              <a
                href={primaryCTA.href}
                className={`w-full sm:w-auto px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl ${
                  isCommercial
                    ? "bg-amber-500 hover:bg-amber-400 text-amber-950 hover:shadow-amber-500/20"
                    : "bg-hvac-blue hover:bg-blue-500 text-white hover:shadow-hvac-blue/30 hover:-translate-y-1"
                }`}
              >
                {primaryCTA.label}
              </a>
            )}
            
            {secondaryCTA && (
              <a
                href={secondaryCTA.href}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold transition-all duration-300 text-slate-300 hover:text-white hover:bg-white/5 border border-slate-700 hover:border-slate-500"
              >
                {secondaryCTA.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
