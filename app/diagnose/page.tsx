import { SYMPTOMS } from "@/data/knowledge-graph";
import Link from "next/link";

export default function SymptomIndexPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <nav className="text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Diagnostic Manuals</span>
      </nav>

      <section className="mb-12">
        <h1 className="mb-4">HVAC Diagnostic Manual Index</h1>
        <p className="text-xl text-gray-600">
          Browse our comprehensive library of residential HVAC troubleshooting guides. 
          Each manual is designed to lead you from symptom to root cause with professional accuracy.
        </p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SYMPTOMS.map((symptom) => (
          <Link 
            key={symptom.id} 
            href={`/diagnose/${symptom.id}`}
            className="manual-card border-l-4 border-l-hvac-blue hover:bg-slate-50 transition-colors"
          >
            <h3 className="m-0 text-hvac-navy">{symptom.name}</h3>
            <p className="text-sm mt-3 text-gray-500">{symptom.description}</p>
            <div className="mt-4 text-xs font-bold text-hvac-gold uppercase tracking-widest">
              View Diagnostic Steps
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-20 p-8 bg-slate-900 text-white rounded-2xl">
        <h2 className="text-white mt-0">Can&apos;t find your symptom?</h2>
        <p className="text-slate-300">
          Our knowledge graph is constantly expanding. If your specific HVAC issue isn&apos;t listed, 
          you can request a standard technical manual from our engineering team.
        </p>
        <button className="btn-primary mt-6 bg-hvac-gold text-hvac-navy px-8 font-black">
          REQUEST NEW MANUAL
        </button>
      </section>
    </div>
  );
}
