export default function ThirtySecondSummary({ 
  points 
}: { 
  points: { label: string, value: string, icon?: string }[] 
}) {
  return (
    <div className="bg-slate-900 text-white rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden border border-slate-800">
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-hvac-gold/50"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-hvac-gold whitespace-nowrap">
            30-Second Executive Summary
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-hvac-gold/50"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {points.map((point, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-l-2 border-hvac-gold pl-2">
                {point.label}
              </span>
              <span className="text-sm font-black text-white leading-tight">
                {point.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center lg:justify-start">
          <a 
            href="#find-local-help" 
            className="group inline-flex items-center gap-3 bg-hvac-gold text-hvac-navy px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-hvac-gold/10"
          >
            Claim Local Repair Coupon <span className="text-lg group-hover:translate-y-1 transition-transform">↓</span>
          </a>
        </div>
      </div>
    </div>
  );
}
