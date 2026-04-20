/**
 * Location Hub Page Template — lead generation.
 * Same design system. Local service + diagnostic hub.
 */
import React from "react";
import Link from "next/link";
import { SmsLegalFooterLinks } from "@/components/SmsLegalFooterLinks";

export default function LocationHubPageTemplate({ location, contentJson }: any) {
  const {
    fast_answer,
    popular_repairs,
    repair_cost_estimates,
    faq,
  } = contentJson || {};

  const city = location?.city ?? location?.name ?? "Your Area";
  const state = location?.state ?? "";

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <nav className="text-sm text-gray-500 mb-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/repair" className="hover:text-hvac-blue">HVAC Repair</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{city}{state ? `, ${state}` : ""}</span>
      </nav>

      <section className="mb-12">
        <div className="inline-block bg-hvac-gold/10 text-hvac-gold text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          Local Service
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight">
          HVAC Repair in {city}{state ? `, ${state}` : ""}
        </h1>
      </section>

      {fast_answer && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-3">Fast Answer</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{fast_answer}</p>
        </section>
      )}

      {popular_repairs?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Popular Repairs</h2>
          <div className="grid gap-4">
            {popular_repairs.map((repair: any, i: number) => (
              <div
                key={i}
                className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                {repair.link ? (
                  <Link href={repair.link} className="font-bold text-hvac-blue hover:underline">
                    {repair.name} →
                  </Link>
                ) : (
                  <strong className="text-hvac-navy dark:text-white">{repair.name}</strong>
                )}
                {repair.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 m-0">{repair.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {repair_cost_estimates?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Typical Repair Costs</h2>
          <div className="space-y-3">
            {repair_cost_estimates.map((est: any, i: number) => (
              <div
                key={i}
                className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <span className="font-bold text-hvac-navy dark:text-white">{est.name || est.type}</span>
                <span className="ml-2 text-hvac-blue">{est.range || est.cost}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {faq?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faq.map((item: any, i: number) => (
              <div
                key={i}
                className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <h3 className="text-lg font-bold text-hvac-navy dark:text-white m-0">{item.question}</h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2 m-0 text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-16 bg-hvac-navy text-white p-10 rounded-2xl text-center">
        <h2 className="text-2xl font-black mb-4 border-0 text-white">Get HVAC Repair in {city}</h2>
        <p className="text-slate-300 mb-6">Connect with local certified technicians.</p>
        <button
          data-open-lead-modal
          className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-8 py-4 rounded-xl uppercase tracking-widest text-sm"
        >
          Request Repair Quote
        </button>
        <SmsLegalFooterLinks className="mt-4 justify-center text-[10px]" tone="onDark" />
      </section>
    </div>
  );
}
