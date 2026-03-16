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
  systems ||--|{ components : has
  symptoms ||--|{ symptom_causes : ""
  causes ||--|{ symptom_causes : ""
  symptoms ||--|{ symptom_conditions : ""
  conditions ||--|{ symptom_conditions : ""
  conditions ||--|{ condition_causes : ""
  causes ||--|{ condition_causes : ""
  causes ||--|{ cause_repairs : ""
  repairs ||--|{ cause_repairs : ""
  causes ||--|{ cause_components : ""
  components ||--|{ cause_components : ""
  repairs ||--|{ repair_components : ""
  components ||--|{ repair_components : ""
  diagnostics ||--|{ diagnostic_steps : ""
  conditions ||--|{ condition_diagnostics : ""
  diagnostics ||--|{ condition_diagnostics : ""
  components ||--o{ parts : ""
  symptoms ||--o{ diagnostic_paths : ""
  conditions ||--o{ diagnostic_paths : ""
  page_targets ||--o{ pages : generates
  page_targets ||--o{ page_generation_runs : ""
  pages ||--o| page_generation_runs : ""
  symptoms ||--o{ generation_queue : ""
  pages ||--o{ generation_queue : ""
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
  components {
    int id PK
    int system_id FK
    string name
    string slug
  }
  symptom_causes {
    int symptom_id PK
    int cause_id PK
  }
  cause_repairs {
    int cause_id PK
    int repair_id PK
  }
  cause_components {
    int cause_id PK
    int component_id PK
  }
  repair_components {
    int repair_id PK
    int component_id PK
  }
  diagnostics {
    int id PK
    string slug
    int symptom_id FK
    int condition_id FK
  }
  diagnostic_steps {
    int id PK
    int diagnostic_id FK
    int step_order
  }
  condition_diagnostics {
    int condition_id PK
    int diagnostic_id PK
  }
  generation_queue {
    int id PK
    string proposed_slug
    string page_type
    string status
    int page_id FK
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
  cities {
    int id PK
    string city
    string state
    string slug
  }
  locations {
    int id PK
    string city
    string state
    string slug
  }
  tools {
    int id PK
    string name
    string slug
  }
  internal_links {
    int id PK
    string source_slug
    string target_slug
    string link_reason
  }
  related_nodes {
    int id PK
    string source_slug
    string target_slug
    string relation_type
  }
  environments {
    int id PK
    string name
    string slug
  }
  vehicle_models {
    int id PK
    string make
    string model
    string slug
  }
  parts {
    int id PK
    string name
    string slug
    int component_id FK
  }
  diagnostic_paths {
    int id PK
    int symptom_id FK
    int condition_id FK
  }
  link_graph {
    int id PK
    int source_page_id FK
    int target_page_id FK
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

      {/* Schema (008 + 010) — full schema after migrations */}
      <section className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 overflow-x-auto">
        <h2 className="text-lg font-bold mb-4">Schema (008 + 010)</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4 text-xs">
          Knowledge graph, page targets, generation_queue, diagnostics, cities, tools, components, internal_links, related_nodes.
        </p>
        <MermaidDiagram chart={SCHEMA_MERMAID} title="Database Schema" downloadFilename="hvac-schema-008-010.svg" />
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
