"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MermaidDiagram = dynamic(() => import("@/components/MermaidDiagram"), { ssr: false });

const SAMPLE_MERMAID = `flowchart TD
  A[AC Not Cooling] --> B{Thermostat set correctly?}
  B -->|No| C[Adjust thermostat]
  B -->|Yes| D{Outdoor unit running?}
  D -->|No| E[Breaker or capacitor issue]
  D -->|Yes| F[Dirty filter / Low refrigerant]`;

const SCHEMA_MERMAID = `erDiagram
  systems ||--|{ symptoms : has
  systems ||--|{ conditions : has
  systems ||--|{ causes : has
  symptoms ||--|{ symptom_causes : ""
  causes ||--|{ symptom_causes : ""
  symptoms ||--|{ symptom_conditions : ""
  conditions ||--|{ symptom_conditions : ""
  conditions ||--|{ condition_causes : ""
  causes ||--|{ condition_causes : ""
  causes ||--|{ cause_repairs : ""
  repairs ||--|{ cause_repairs : ""
  page_targets ||--o{ pages : generates
  page_targets ||--o{ page_generation_runs : ""
  pages ||--o| page_generation_runs : ""
  systems {
    int id PK
    string name
    string slug
  }
  symptoms {
    int id PK
    int system_id FK
    string name
    string slug
  }
  causes {
    int id PK
    int system_id FK
    string name
    string slug
  }
  repairs {
    int id PK
    string name
    string slug
    string difficulty
  }
  symptom_causes {
    int symptom_id PK
    int cause_id PK
  }
  cause_repairs {
    int cause_id PK
    int repair_id PK
  }
  page_targets {
    int id PK
    string slug
    string page_type
  }
  pages {
    int id PK
    string slug
    string page_type
    string content
  }
  locations {
    int id PK
    string city
    string state
    string slug
  }
  contractors {
    int id PK
    string company_name
    string slug
  }
  leads {
    int id PK
    int contractor_id FK
    int location_id FK
    string status
  }`;

export default function TestDbPage() {
  const [result, setResult] = useState<{
    ok: boolean;
    tables?: { name: string; count: number }[];
    error?: string;
    mermaidOk?: boolean;
  }>({ ok: false });

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch("/api/test-db");
        const data = await res.json();
        setResult(data);
      } catch (e: any) {
        setResult({ ok: false, error: e?.message });
      }
    }
    run();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 font-mono text-sm">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-hvac-navy dark:text-white">
          Neon + Mermaid Test
        </h1>
        <a href="/test-generate" className="text-sm text-blue-600 hover:underline">
          Test Generate →
        </a>
      </div>

      {/* Schema (008) — structure before seeding */}
      <section className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 overflow-x-auto">
        <h2 className="text-lg font-bold mb-4">Schema (008) — Before Seeding</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4 text-xs">
          Knowledge graph + page targets + leads. Run migration before seeding.
        </p>
        <MermaidDiagram chart={SCHEMA_MERMAID} title="Database Schema" downloadFilename="hvac-schema-008.svg" />
      </section>

      {/* DB Status */}
      <section className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200">
        <h2 className="text-lg font-bold mb-4">Database (Neon)</h2>
        {result.ok ? (
          <>
            <p className="text-green-600 dark:text-green-400 mb-4">✅ Connection OK</p>
            {result.tables && result.tables.length > 0 && (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2">Table</th>
                    <th className="py-2">Rows</th>
                  </tr>
                </thead>
                <tbody>
                  {result.tables.map((t) => (
                    <tr key={t.name} className="border-b border-slate-100">
                      <td className="py-2">{t.name}</td>
                      <td className="py-2">{t.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <p className="text-red-600 dark:text-red-400">
            ❌ {result.error || "Connection failed or DATABASE_URL not set"}
          </p>
        )}
      </section>

      {/* Mermaid Diagram (ssr: false) */}
      <section className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200">
        <h2 className="text-lg font-bold mb-4">Mermaid Diagram (client-only render)</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4 text-xs">
          If this renders without freezing, ssr:false is working.
        </p>
        <MermaidDiagram chart={SAMPLE_MERMAID} title="Sample Diagnostic Flowchart" />
      </section>

      {/* SQL Queries Reference */}
      <section className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <h2 className="text-lg font-bold mb-4">Key Queries (diagnostic-engine)</h2>
        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <li>• symptoms (slug)</li>
          <li>• causes JOIN symptom_causes</li>
          <li>• repairs JOIN cause_repairs</li>
          <li>• pages (slug, content_json)</li>
        </ul>
      </section>
    </div>
  );
}
