'use client';

import { useState } from 'react';

export default function Home() {
  const [project, setProject] = useState('DecisionGrid');
  const [batchSize, setBatchSize] = useState(25);
  const [maxCost, setMaxCost] = useState(2);
  const [status, setStatus] = useState('Idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [cost, setCost] = useState(0);

  const runBatch = async () => {
    setStatus('Running');
    setResults([]);
    setErrors([]);

    const res = await fetch('/api/run', {
      method: 'POST',
      body: JSON.stringify({ project, batchSize, maxCost }),
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      setStatus('Error');
      return;
    }

    setResults(data.urls || []);
    setErrors(data.errors || []);
    setCost(data.cost || 0);
    setProgress(data.completed || 0);
    setStatus('Complete');
  };

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <h1 className="text-2xl font-bold">Orchestrator</h1>

      <div className="grid grid-cols-2 gap-6">

        {/* RUN PANEL */}
        <div className="border rounded-xl p-4 space-y-3">
          <h2 className="font-bold">Run Batch</h2>

          <select value={project} onChange={(e) => setProject(e.target.value)} className="w-full border p-2">
            <option>DecisionGrid</option>
            <option>HVAC</option>
            <option>TruAlign</option>
          </select>

          <input
            type="number"
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="border p-2 w-full"
          />

          <input
            type="number"
            value={maxCost}
            onChange={(e) => setMaxCost(Number(e.target.value))}
            className="border p-2 w-full"
          />

          <div className="flex gap-2">
            <button
              onClick={runBatch}
              className="bg-black text-white px-4 py-2 rounded flex-1"
            >
              ▶ Run
            </button>

            <button
              onClick={() => {
                fetch('/api/stop');
                setStatus('Aborted by user');
              }}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              ⛔ STOP
            </button>
          </div>
        </div>

        {/* STATUS PANEL */}
        <div className="border rounded-xl p-4 space-y-2">
          <h2 className="font-bold">Status</h2>

          <p>Status: {status}</p>
          <p>Progress: {progress}</p>
          <p>Cost: ${cost.toFixed(2)}</p>

        </div>
      </div>

      {/* RESULTS */}
      <div className="border rounded-xl p-4">
        <h2 className="font-bold mb-2">Results</h2>

        {results.map((r, i) => (
          <div key={i} className="text-green-600">{r}</div>
        ))}

        {errors.map((e, i) => (
          <div key={i} className="text-red-600">{e}</div>
        ))}
      </div>

    </div>
  );
}
