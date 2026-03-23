import { ShieldCheck, MapPin, Wrench, AlertTriangle, CheckCircle2, Clock, Map, PhoneCall } from "lucide-react";
import { RelatedTopics } from "@/components/hub/RelatedTopics";

export interface CityServiceSchema {
  page_type: "hybrid";
  slug: string;
  title: string;
  hero: { headline: string; subheadline: string; authorityLine: string };
  problemSection: { summary: string; symptoms: string[]; impact: string };
  authoritySection: { technicalExplanation: string; commonCauses: string[]; riskFactors: string[] };
  solutionSection: { howWeFixIt: string[]; serviceApproach: string; timeToFix: string };
  trustSection: { experience: string; certifications: string[]; guarantees: string[] };
  localSection: { primaryCity: string; areasServed: string[]; localProof: string };
  cta: { primary: string; secondary: string; urgency: string };
  faq: { question: string; answer: string }[];
  seo?: { metaTitle?: string; metaDescription?: string };
}

export default function HybridServicePageTemplate({ data, phoneNumber = "(555) 123-4567" }: { data: CityServiceSchema; phoneNumber?: string }) {
  return (
    <div className="bg-white min-h-screen font-sans text-slate-800">
      
      {/* 1. HERO BLOCK */}
      <section className="bg-slate-900 text-white pt-24 pb-28 px-4 border-b-4 border-amber-500 relative">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest mb-6 border border-amber-500/30">
            <ShieldCheck className="w-4 h-4" />
            {data.hero?.authorityLine || "Trusted Local Experts"}
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight drop-shadow-md">
            {data.hero?.headline || data.title}
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-light max-w-3xl mx-auto mb-10">
            {data.hero?.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={`tel:${phoneNumber.replace(/\D/g, '')}`} className="bg-amber-500 hover:bg-amber-400 text-amber-950 px-8 py-4 rounded-xl font-black text-xl flex items-center justify-center gap-3 shadow-lg transition-transform hover:-translate-y-1">
              <PhoneCall className="w-6 h-6" />
              {data.cta?.primary || "Call Now"}
            </a>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION (Urgency) */}
      <section className="py-16 px-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="md:w-2/3">
              <h2 className="text-3xl font-bold mb-4 text-slate-900 border-l-4 border-red-500 pl-4">The Problem</h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-6 font-medium">
                {data.problemSection?.summary}
              </p>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                <p className="text-red-900 font-semibold">{data.problemSection?.impact}</p>
              </div>
            </div>
            <div className="md:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 w-full">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Common Symptoms
              </h3>
              <ul className="flex flex-col gap-3">
                {data.problemSection?.symptoms?.map((sym, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700 font-medium">
                    <span className="text-red-500 mt-1">•</span> {sym}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AUTHORITY SECTION (Why It Happens) */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-slate-900">Why Is This Happening?</h2>
        <p className="text-lg text-slate-700 leading-relaxed mb-8">
          {data.authoritySection?.technicalExplanation}
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-slate-800">Most Likely Causes</h3>
            <ul className="flex flex-col gap-3">
              {data.authoritySection?.commonCauses?.map((cause, i) => (
                <li key={i} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Wrench className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold text-slate-700">{cause}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">Risk Factors</h3>
            <ul className="flex flex-col gap-3">
              {data.authoritySection?.riskFactors?.map((risk, i) => (
                <li key={i} className="flex text-amber-800 gap-2 items-start bg-amber-50 p-3 rounded-lg">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span className="font-medium text-sm">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. SOLUTION SECTION (How We Fix It) */}
      <section className="bg-hvac-blue text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Repair Diagnosis & Solution</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl">
            {data.solutionSection?.serviceApproach}
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/10 p-6 rounded-xl border border-white/20">
              <h3 className="font-bold text-xl mb-4 text-amber-400">The Fix Protocol</h3>
              <ul className="flex flex-col gap-4">
                {data.solutionSection?.howWeFixIt?.map((step, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <CheckCircle2 className="w-6 h-6 text-blue-300 shrink-0" />
                    <span className="font-medium">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col justify-center bg-white/5 p-6 rounded-xl border border-white/10 text-center">
              <Clock className="w-12 h-12 text-blue-300 mx-auto mb-4" />
              <h3 className="font-bold text-2xl mb-2 text-white">Expected Completion</h3>
              <p className="text-xl text-blue-200">{data.solutionSection?.timeToFix}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5 & 6. TRUST + LOCAL SECTION */}
      <section className="py-16 px-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          {/* Trust */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Guaranteed Reliability</h2>
            <p className="text-slate-600 mb-6 font-medium">{data.trustSection?.experience}</p>
            <div className="flex justify-between items-start flex-col gap-4">
               <div>
                  <h4 className="font-bold text-sm text-slate-400 uppercase tracking-widest mb-2">Certifications</h4>
                  {data.trustSection?.certifications?.map((cert,i) => <p key={i} className="text-slate-800 font-bold">{cert}</p>)}
               </div>
               <div>
                  <h4 className="font-bold text-sm text-slate-400 uppercase tracking-widest mb-2">Our Promise</h4>
                  {data.trustSection?.guarantees?.map((g,i) => <p key={i} className="flex items-center gap-2 text-emerald-700 font-bold"><CheckCircle2 className="w-4 h-4"/>{g}</p>)}
               </div>
            </div>
          </div>

          {/* Local */}
          <div className="bg-orange-50 p-8 rounded-2xl border border-orange-100 flex flex-col justify-center">
            <MapPin className="w-10 h-10 text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-orange-900">Serving {data.localSection?.primaryCity}</h2>
            <p className="text-orange-800 mb-6 font-medium">{data.localSection?.localProof}</p>
            <div className="grid grid-cols-2 gap-2">
              {data.localSection?.areasServed?.map((area, i) => (
                <div key={i} className="flex items-center gap-2 text-orange-900/80 text-sm font-semibold">
                   <Map className="w-4 h-4 opacity-50"/> {area}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ BLOCK */}
      <section className="py-20 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl font-black mb-10 text-center">Frequently Asked Questions</h2>
        <div className="flex flex-col gap-6">
          {data.faq?.map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-xl text-slate-900 mb-3">{item.question}</h3>
              <p className="text-slate-700 leading-relaxed font-medium">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. CTA SECTION (Footer + Mobile Sticky) */}
      <section className="bg-slate-900 text-center py-20 px-4 border-t-4 border-blue-500">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">{data.cta?.urgency || "Don't Wait For It To Break Down Completely."}</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <a href={`tel:${phoneNumber.replace(/\D/g, '')}`} className="bg-amber-500 hover:bg-amber-400 text-amber-950 px-8 py-5 rounded-xl font-black text-2xl flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 transition-transform hover:-translate-y-1">
              <PhoneCall className="w-6 h-6" />
              {data.cta?.primary || "Call Now"}
            </a>
          </div>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/95 backdrop-blur border-t border-slate-200 z-50 md:hidden flex justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <a href={`tel:${phoneNumber.replace(/\D/g, '')}`} className="w-full bg-slate-900 border-2 border-slate-800 text-white font-black py-4 rounded-xl text-center flex items-center justify-center gap-2">
          <PhoneCall className="w-5 h-5 text-amber-400" />
          {data.cta?.primary || "Call Now"}
        </a>
      </div>

      {/* Internal Crawl Accelerator */}
      <div className="bg-slate-50 pt-10 border-t border-slate-200 pb-24 md:pb-0">
         <RelatedTopics />
      </div>

    </div>
  );
}
