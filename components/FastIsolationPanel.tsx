import React from 'react';

export default function FastIsolationPanel({ guidedDiagnosis }: { guidedDiagnosis?: any[] }) {
  if (!guidedDiagnosis || guidedDiagnosis.length === 0) return null;

  return (
    <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-md mb-6 relative overflow-hidden">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">⚡ Fast Diagnosis</h2>

      <ul className="space-y-3 text-sm relative z-10">
        {guidedDiagnosis.map((g: any, i: number) => (
          <li key={i} className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span>{g.scenario}</span>
            <span className="opacity-50 hidden sm:inline">→</span>
            <b className="text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded whitespace-normal">
              {g.likely_modes?.join(', ') || g.next_step}
            </b>
          </li>
        ))}
      </ul>
    </div>
  );
}
