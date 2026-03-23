import { ShieldCheck, PhoneCall, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface AuthoritySchema {
  type: "authority";
  slug: string;
  title: string;
  hero: { headline: string; subheadline: string };
  explanation: string;
  whyItMatters: string;
  commonIssues: string[];
  whenToCall: string;
  localTrust: { experience: string; guarantee: string };
  cta: { primary: string; secondary?: string };
  seo?: { metaTitle?: string; metaDescription?: string };
}

export function AuthorityPageTemplate({
  content,
  phoneNumber = "(555) 123-4567"
}: {
  content: AuthoritySchema;
  phoneNumber?: string;
}) {
  return (
    <div className="bg-white min-h-screen">
      {/* 1. Hero Block */}
      <section className="bg-slate-900 text-white pt-20 pb-24 md:pt-28 md:pb-32 px-4 border-b-4 border-hvac-blue relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white drop-shadow-md">
            {content.hero?.headline || content.title}
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-light max-w-3xl mx-auto">
            {content.hero?.subheadline}
          </p>
        </div>
      </section>

      {/* 2. Text Block (Explanation) */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-slate-900">Understanding Your System</h2>
        <p className="text-lg text-slate-700 leading-relaxed font-medium">
          {content.explanation}
        </p>
      </section>

      {/* 3. Highlight Block (Why It Matters) */}
      <section className="bg-amber-50 border-y border-amber-100 py-16 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-start">
          <div className="bg-amber-100 p-4 rounded-full text-amber-600 shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3 text-amber-900">Why This Matters</h2>
            <p className="text-lg text-amber-800/80 leading-relaxed">
              {content.whyItMatters}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Bullet List (Common Issues) */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-slate-900">Common Breakdown Vectors</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.commonIssues?.map((issue, idx) => (
            <li key={idx} className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <CheckCircle2 className="text-blue-600 w-6 h-6 shrink-0" />
              <span className="font-semibold text-slate-800">{issue}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 5. Trust Bar (Local Trust) */}
      <section className="bg-slate-900 text-white py-12 px-4 shadow-xl relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-around gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-blue-400" />
            <span className="font-bold text-lg">{content.localTrust?.experience}</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <span className="font-bold text-lg">{content.localTrust?.guarantee}</span>
          </div>
        </div>
      </section>

      {/* 6. CTA Section (When To Call) */}
      <section className="bg-blue-50 py-20 px-4 text-center border-t border-blue-100 mb-20 md:mb-0">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-slate-900">When Should You Call A Professional?</h2>
          <p className="text-xl text-slate-700 mb-10 font-medium max-w-2xl mx-auto">
            {content.whenToCall}
          </p>
          <div className="flex justify-center gap-4 flex-col sm:flex-row">
            <a href={`tel:${phoneNumber.replace(/\D/g, '')}`} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black text-xl flex items-center justify-center gap-3 shadow-lg transition-transform hover:-translate-y-1">
              <PhoneCall className="w-6 h-6" />
              {content.cta?.primary || "Call Now"}
            </a>
            {content.cta?.secondary && (
              <button className="bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-bold px-8 py-4 rounded-xl transition-colors">
                {content.cta.secondary}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 7. Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/95 backdrop-blur border-t border-slate-200 z-50 md:hidden flex justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <a href={`tel:${phoneNumber.replace(/\D/g, '')}`} className="w-full bg-slate-900 shadow-xl shadow-slate-900/20 text-white font-black py-4 rounded-xl text-center flex items-center justify-center gap-2">
          <PhoneCall className="w-5 h-5" />
          {content.cta?.primary || "Call Now"}
        </a>
      </div>
    </div>
  );
}
