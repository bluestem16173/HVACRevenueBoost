import { RelatedTopics } from "@/components/hub/RelatedTopics";
import { CheckCircle, ShieldCheck, Wrench, Settings, ArrowRight } from "lucide-react";
import Link from "next/link";

export interface ComponentSchema {
  pageType: "component";
  slug: string;
  title: string;
  hook: string;
  problem: string;
  symptoms: string[];
  trust: {
    experience: string;
    guarantee: string;
  };
  cta: {
    headline: string;
    actions: string[];
  };
  seo?: {
    metaTitle: string;
    metaDescription: string;
  };
  content?: {
    whatItDoes?: string;
    whereItIsLocated?: string;
    commonFailureCauses?: string[];
    howToTestIt?: string[];
    repairVsReplace?: string;
    costRange?: string;
    relatedProblems?: string[];
  }
}

export default function ComponentPageTemplate({ data }: { data: ComponentSchema }) {
  const replaceTitle = data.title.includes("What Is an") ? data.title : `What Is an ${data.slug.replace(/-/g, ' ')}? (And How It Fails)`;
  const trustExperience = data.trust?.experience ?? "";
  const trustGuarantee = data.trust?.guarantee ?? "";
  const ctaHeadline = data.cta?.headline ?? "";
  const ctaActions = Array.isArray(data.cta?.actions) ? data.cta.actions : [];
  const symptomsList = Array.isArray(data.symptoms) ? data.symptoms : [];
  const content = data.content;
  const commonFailureCauses =
    content && Array.isArray(content.commonFailureCauses) ? content.commonFailureCauses : [];
  const howToTestIt = content && Array.isArray(content.howToTestIt) ? content.howToTestIt : [];
  const relatedProblems =
    content && Array.isArray(content.relatedProblems) ? content.relatedProblems : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 🦸‍♂️ HERO SECTION */}
      <section className="bg-hvac-navy text-white pt-24 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_50%)] pointer-events-none"></div>
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
          <div className="inline-block border border-blue-500/30 bg-blue-500/10 text-blue-200 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            Component Repair & Replacement
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
            {replaceTitle}
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 leading-relaxed font-medium max-w-2xl mx-auto">
            {data.hook ?? ""}
          </p>
        </div>
      </section>

      {/* ⚠️ PROBLEM CONTEXT & 8-STEP BREAKDOWN */}
      <section className="py-16 -mt-16 relative z-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 shadow-xl mb-12">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              What It Does
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed pl-11 mb-8">
              {data.content?.whatItDoes || data.problem || "This component regulates critical workflow inside your system. Failure stops basic operation."}
            </p>

            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Where It Is Located
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed pl-11 mb-8">
              {data.content?.whereItIsLocated || "Typically housed deep within the main cabinet, making direct visual inspection difficult without disassembling access panels."}
            </p>

            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
              Symptoms of Failure
            </h2>
            <ul className="list-disc pl-16 space-y-2 text-slate-700 dark:text-slate-300 font-medium mb-8">
              {symptomsList.length
                ? symptomsList.map((s, i) => (
                    <li key={i} className="capitalize">
                      {s}
                    </li>
                  ))
                : [<li key="fallback">Intermittent starting and stopping</li>]}
            </ul>

            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
              Common Failure Causes
            </h2>
            <ul className="list-disc pl-16 space-y-2 text-slate-700 dark:text-slate-300 font-medium mb-8">
              {commonFailureCauses.length ? (
                commonFailureCauses.map((c, i) => <li key={i}>{c}</li>)
              ) : (
                <>
                  <li>Age and normal mechanical wear</li>
                  <li>Overheating due to poor airflow or dirty filters</li>
                  <li>Electrical surges damaging internal contacts</li>
                </>
              )}
            </ul>

            <div className="grid md:grid-cols-2 gap-8 pl-11 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span className="bg-slate-200 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">5</span>
                  How to Test It
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {howToTestIt.length ? (
                    howToTestIt.map((c, i) => <li key={i}>{c}</li>)
                  ) : (
                    <>
                      <li>Listen for buzzing/clicking when the thermostat calls.</li>
                      <li>Use a multimeter to measure continuity across the terminals.</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span className="bg-slate-200 dark:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">6</span>
                  Repair vs Replace
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {data.content?.repairVsReplace || "These components are sealed and cannot be repaired. Total replacement is the only safe and code-compliant option."}
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">7</span>
              Cost Range
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed pl-11 mb-8">
              {data.content?.costRange || "Depending on tonnage and OEM brackets, expect between $180 to $650 including diagnostic fee, warranty, and professional installation."}
            </p>

            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
              <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">8</span>
              Related Problems
            </h2>
            <ul className="list-disc pl-16 space-y-2 text-slate-700 dark:text-slate-300 font-medium">
              {relatedProblems.length ? (
                relatedProblems.map((r, i) => <li key={i}>{r}</li>)
              ) : (
                <>
                  <li>System won&apos;t turn off</li>
                  <li>Constant tripping of the main breaker</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </section>



      {/* 🛡️ TRUST & CTA */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="flex flex-col md:flex-row justify-center gap-8 mb-12">
            <div className="flex items-center justify-center gap-3 text-slate-600 dark:text-slate-300 font-bold">
              <ShieldCheck className="text-green-500 w-6 h-6" />
              {trustExperience}
            </div>
            <div className="flex items-center justify-center gap-3 text-slate-600 dark:text-slate-300 font-bold">
              <CheckCircle className="text-hvac-blue w-6 h-6" />
              {trustGuarantee}
            </div>
          </div>

          <div className="bg-gradient-to-br from-hvac-navy to-slate-900 border border-slate-800 p-12 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight">
                {ctaHeadline}
              </h2>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                {ctaActions.map((action, idx) => (
                  <button 
                    key={idx}
                    data-open-lead-modal
                    className={`w-full sm:w-auto px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl ${
                      idx === 0 
                      ? "bg-hvac-blue hover:bg-blue-500 text-white hover:scale-105" 
                      : "bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white"
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
          <RelatedTopics />
    </div>
  );
}
