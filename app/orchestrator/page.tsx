'use client';

import { useState, useEffect } from 'react';

export default function OrchestratorDashboard() {
  const [secret, setSecret] = useState('');
  const [runs, setRuns] = useState<any[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  
  const [runData, setRunData] = useState<any>(null);
  const [runSteps, setRunSteps] = useState<any[]>([]);
  const [runPages, setRunPages] = useState<any[]>([]);

  // CONTROLS
  const [project, setProject] = useState('HVAC');
  const [batchSize, setBatchSize] = useState(1);
  const [maxCost, setMaxCost] = useState(2.00);

  /** Gate: load queue preview + confirm before RUN PIPELINE */
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewJobs, setPreviewJobs] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewAck, setPreviewAck] = useState(false);
  
  const headers = { 'Content-Type': 'application/json', 'x-orchestrator-secret': secret };

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(() => {
      fetchRuns();
      if (activeRunId) fetchRunDetails(activeRunId);
    }, 3000);
    return () => clearInterval(interval);
  }, [secret, activeRunId]);

  useEffect(() => {
    setPreviewLoaded(false);
    setPreviewAck(false);
    setPreviewJobs([]);
    setPreviewError(null);
  }, [batchSize]);

  const fetchRuns = async () => {
    if (!secret) return;
    try {
      const res = await fetch('/api/orchestrator/runs', { headers });
      const data = await res.json();
      if (data.runs) {
        setRuns(data.runs);
        if (!activeRunId && data.runs.length > 0) setActiveRunId(data.runs[0].id);
      }
    } catch(e) {}
  };

  const fetchRunDetails = async (id: string) => {
    try {
      const [resRun, resPages] = await Promise.all([
        fetch(`/api/orchestrator/runs/${id}`, { headers }),
        fetch(`/api/orchestrator/runs/${id}/pages`, { headers })
      ]);
      const dataRun = await resRun.json();
      const dataPages = await resPages.json();
      if (dataRun.run) setRunData(dataRun.run);
      if (dataRun.steps) setRunSteps(dataRun.steps);
      if (dataPages.pages) setRunPages(dataPages.pages);
    } catch(e) {}
  };

  const loadPreviewQueue = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch(`/api/orchestrator/preview-queue?batchSize=${batchSize}`, { headers });
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error || res.statusText);
        setPreviewLoaded(false);
        setPreviewJobs([]);
        return;
      }
      setPreviewJobs(data.jobs || []);
      setPreviewLoaded(true);
      setPreviewAck(false);
    } catch (e: unknown) {
      setPreviewError(e instanceof Error ? e.message : 'Preview failed');
      setPreviewLoaded(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const startRun = async () => {
    const res = await fetch('/api/orchestrator/run', {
      method: 'POST',
      headers,
      body: JSON.stringify({ project, batchSize, maxCost })
    });
    const data = await res.json();
    if (data.runId) {
      setActiveRunId(data.runId);
      setPreviewAck(false);
      setPreviewLoaded(false);
      setPreviewJobs([]);
    }
  };

  const stopRun = async () => {
    if (!activeRunId) return;
    await fetch('/api/orchestrator/stop', {
      method: 'POST',
      headers,
      body: JSON.stringify({ runId: activeRunId })
    });
  };

  const requeueSlugs = async (slugs: string[]) => {
    await fetch(`/api/orchestrator/runs/${activeRunId}/requeue`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ slugs })
    });
    alert("Requeued successfully!");
  };

  const activeRun = runs.find(r => r.status === 'running' || r.status === 'queued');
  const isLocked = !!activeRun;

  const canAuthorizeRun = previewLoaded && previewAck && !isLocked;

  // Stats calculation
  const pagesCreated = runPages.filter(p => p.status === 'created').length;
  const failures = runPages.filter(p => p.status === 'failed' || p.status_band === 'failed' || p.status_band === 'warn').length;
  const avgScore = runPages.length > 0 ? Math.round(runPages.reduce((acc, p) => acc + (p.total_score || 0), 0) / runPages.length) : 0;
  
  const issueCounts: Record<string, number> = {};
  runPages.forEach(p => {
    if (p.recommendations) {
      p.recommendations.forEach((r: any) => {
        issueCounts[r.issue] = (issueCounts[r.issue] || 0) + 1;
      });
    }
  });
  const topIssue = Object.keys(issueCounts).sort((a,b) => issueCounts[b] - issueCounts[a])[0] || 'None';

  if (!secret) {
    return (
      <div className="p-10 max-w-md mx-auto mt-20 bg-slate-100 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Orchestrator Auth</h2>
        <input 
          type="password" 
          placeholder="ORCHESTRATOR_SECRET" 
          value={secret} 
          onChange={e => setSecret(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <section className="rounded-xl border border-blue-200 bg-blue-50/80 p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-black text-slate-900">Preview before you authorize</h2>
          <p className="mb-4 text-sm text-slate-600">
            Load the next <strong>{batchSize}</strong> job(s) from the generation queue (read-only). Open each link to see the
            <strong> current live page</strong> (if it exists). Then confirm before starting the pipeline — same slugs will be
            processed by the worker.
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadPreviewQueue}
              disabled={previewLoading || isLocked}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {previewLoading ? 'Loading…' : 'Load next batch preview'}
            </button>
            {previewError ? (
              <span className="text-sm font-medium text-red-600">{previewError}</span>
            ) : null}
          </div>
          {previewLoaded ? (
            <div className="space-y-3">
              {previewJobs.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  No draft jobs match this batch size right now. The pipeline will still start but may complete with little or no
                  work.
                </p>
              ) : (
                <ul className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white text-sm">
                  {previewJobs.map((j) => (
                    <li
                      key={j.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 last:border-0"
                    >
                      <span className="font-mono text-slate-800">{j.proposed_slug}</span>
                      <span className="text-xs font-bold uppercase text-slate-500">{j.page_type || '—'}</span>
                      <a
                        href={j.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-blue-600 hover:underline"
                      >
                        Open live preview ↗
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={previewAck}
                  onChange={(e) => setPreviewAck(e.target.checked)}
                />
                <span>
                  I reviewed the preview URLs above (or confirmed the queue is empty). I authorize starting the orchestrator
                  pipeline for this batch.
                </span>
              </label>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Load preview once per run before enabling <strong>RUN PIPELINE</strong>.</p>
          )}
        </section>

        <header className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">DecisionGrid C2</h1>
            <p className="text-slate-500 font-medium">Auto-Healing Generation Orchestrator v1</p>
          </div>
          <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border">
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase">SYS_LOCK</span>
              <span className={`block font-bold ${isLocked ? 'text-orange-600' : 'text-green-600'}`}>
                {isLocked ? 'LOCKED' : 'OPEN'}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase">RUNTIME_COST</span>
              <span className="block font-bold">${runData?.actual_cost || '0.00'}</span>
            </div>
          </div>
        </header>

        {/* CONTROL BAR */}
        <section className="bg-white p-5 rounded-xl border shadow-sm flex items-end gap-6 justify-between">
          <div className="flex gap-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">PROJECT</label>
               <input value={project} onChange={e=>setProject(e.target.value)} className="border p-2 rounded bg-slate-50 w-32" disabled={isLocked} />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">BATCH SIZE</label>
               <input type="number" value={batchSize} onChange={e=>setBatchSize(Number(e.target.value))} className="border p-2 rounded bg-slate-50 w-24" disabled={isLocked} />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-1">MAX COST ($)</label>
               <input type="number" value={maxCost} onChange={e=>setMaxCost(Number(e.target.value))} className="border p-2 rounded bg-slate-50 w-24" disabled={isLocked} />
             </div>
          </div>
          <div className="flex gap-3">
             <button onClick={stopRun} disabled={!isLocked} className="px-6 py-2 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200 disabled:opacity-50 transition">STOP</button>
             <button
               onClick={startRun}
               disabled={!canAuthorizeRun}
               title={!previewLoaded ? 'Load batch preview and confirm first' : !previewAck ? 'Check the authorization box' : ''}
               className="rounded bg-slate-900 px-8 py-2 font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
             >
               RUN PIPELINE
             </button>
          </div>
        </section>

        <div className="grid grid-cols-12 gap-6">
          
          {/* LATEST RUN COLUMN */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            <div className="bg-white border rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                Run Summary 
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 uppercase">{runData?.status || 'IDLE'}</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded border">
                  <div className="text-xs text-slate-500 font-bold">CREATED</div>
                  <div className="text-2xl font-black text-slate-800">{pagesCreated}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded border">
                  <div className="text-xs text-slate-500 font-bold">FAILURES</div>
                  <div className="text-2xl font-black text-red-600">{failures}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded border">
                  <div className="text-xs text-slate-500 font-bold">AVG SCORE</div>
                  <div className="text-2xl font-black text-slate-800">{avgScore}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded border">
                  <div className="text-xs text-slate-500 font-bold">SPEND</div>
                  <div className="text-2xl font-black text-slate-800">${Number(runData?.actual_cost || 0).toFixed(4)}</div>
                </div>
                <div className="col-span-2 bg-orange-50 p-3 rounded border border-orange-100">
                  <div className="text-xs text-orange-600 font-bold">TOP ISSUE</div>
                  <div className="font-bold text-orange-900">{topIssue.replace(/_/g, ' ')}</div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl shadow-sm p-5 max-h-[500px] overflow-y-auto">
              <h3 className="font-bold text-lg mb-4">Live Execution Feed</h3>
              <div className="space-y-3">
                {runSteps.map((step, i) => (
                  <div key={i} className="flex gap-3 text-sm border-l-2 p-2 pl-3 border-slate-200">
                    <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${step.status === 'warn' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>{step.status}</span>
                    <span className="text-slate-700 font-medium">{step.message}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border rounded-xl shadow-sm p-5">
               <h3 className="font-bold text-lg mb-4">Run History</h3>
               <div className="space-y-2 max-h-[300px] overflow-y-auto">
                 {runs.map(r => (
                   <button 
                     key={r.id}
                     onClick={() => setActiveRunId(r.id)}
                     className={`w-full text-left p-3 rounded border flex justify-between items-center text-sm ${activeRunId === r.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-slate-50 hover:bg-slate-100'}`}
                   >
                     <div>
                       <div className="font-bold">{new Date(r.created_at || r.started_at).toLocaleTimeString()}</div>
                       <div className="text-slate-500 text-xs">cost: ${Number(r.actual_cost).toFixed(2)}</div>
                     </div>
                     <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${r.status==='completed'?'bg-green-100 text-green-700': r.status==='failed'?'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>{r.status}</span>
                   </button>
                 ))}
               </div>
            </div>

          </div>

          {/* PAGE AUDIT TABLE */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
              <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg">Page Audits & Auto-Healing</h3>
                <button 
                  onClick={() => requeueSlugs(runPages.filter(p => p.recommendations?.length > 0).map(p => p.slug))}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded text-sm transition shadow-sm"
                >
                  ⚡ Requeue All Failures
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-white">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 sticky top-0 z-10 border-b">
                     <tr>
                       <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Page Slug</th>
                       <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                       <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
                       <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Details</th>
                       <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                     {runPages.map((p, i) => (
                       <tr key={i} className="hover:bg-slate-50">
                         <td className="p-3 text-sm font-medium text-slate-900 border-r bg-slate-50/50">
                           <a href={p.url || `/diagnose/${p.slug}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                             {p.slug} <span className="opacity-50">↗</span>
                           </a>
                         </td>
                         <td className="p-3">
                           {p.status_band ? (
                             <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${p.status_band === 'excellent' ? 'bg-green-100 text-green-700' : p.status_band === 'solid' ? 'bg-blue-100 text-blue-700' : p.status_band === 'warn' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                               {p.status_band}
                             </span>
                           ) : (
                             <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-slate-100 text-slate-600">{p.status}</span>
                           )}
                         </td>
                         <td className="p-3 text-sm font-bold text-slate-700">
                           {p.total_score || '-'} <span className="text-slate-400 font-normal">/ 100</span>
                         </td>
                         <td className="p-3 text-sm">
                           {p.error ? (
                             <div className="text-red-600 font-medium text-xs bg-red-50 p-2 rounded">{p.error}</div>
                           ) : p.recommendations && p.recommendations.length > 0 ? (
                             <div className="space-y-1">
                               {p.recommendations.map((r: any, idx: number) => (
                                 <div key={idx} className="flex gap-2 items-center bg-orange-50 border border-orange-100 p-1.5 rounded">
                                   <span className="text-orange-600">❌</span> 
                                   <span className="font-semibold text-slate-800 text-xs">{r.issue.replace(/_/g, ' ')}</span>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">✅ Clean Matrix</span>
                           )}
                         </td>
                         <td className="p-3">
                           {(p.recommendations?.length > 0 || p.status === 'failed') && (
                             <button 
                               onClick={() => requeueSlugs([p.slug])}
                               className="text-xs bg-white border border-slate-300 shadow-sm hover:bg-slate-50 font-bold py-1.5 px-3 rounded whitespace-nowrap"
                             >
                               Fix & Regenerate
                             </button>
                           )}
                         </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
                {runPages.length === 0 && (
                  <div className="p-10 text-center text-slate-400 font-medium">No pages generated in this run.</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
