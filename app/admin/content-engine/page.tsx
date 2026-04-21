"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ContentEngineDashboard() {
  const [token, setToken] = useState<string>("");
  const [isAuth, setIsAuth] = useState(false);

  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [failedJobs, setFailedJobs] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [seedPrompt, setSeedPrompt] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
      setIsAuth(true);
    }
  }, []);

  const fetchAll = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [stRes, lgRes, pgRes, flRes] = await Promise.all([
        fetch("/api/control/status", { headers }),
        fetch("/api/control/logs", { headers }),
        fetch("/api/control/pages", { headers }),
        fetch("/api/control/failed", { headers })
      ]);

      if (stRes.status === 401) {
        setIsAuth(false);
        localStorage.removeItem("admin_token");
        return;
      }

      if (stRes.ok) setStatus(await stRes.json());
      if (lgRes.ok) setLogs((await lgRes.json()).logs || []);
      if (pgRes.ok) setPages((await pgRes.json()).pages || []);
      if (flRes.ok) setFailedJobs((await flRes.json()).failed || []);
    } catch (err) {}
  };

  useEffect(() => {
    if (isAuth) {
      fetchAll();
      const interval = setInterval(fetchAll, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuth, token]);

  const handleAction = async (endpoint: string, actionName: string, body?: any) => {
    setLoadingAction(actionName);
    try {
      const res = await fetch(endpoint, { 
        method: "POST", 
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAll();
    } catch (e: any) {
      alert("Action failed: " + e.message);
    }
    setLoadingAction(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("admin_token", token);
    setIsAuth(true);
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#0A101D] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl max-w-sm w-full">
          <h2 className="text-xl font-bold text-white mb-4">Orchestrator Login</h2>
          <input 
            type="password" 
            value={token} onChange={e => setToken(e.target.value)}
            placeholder="Admin Token"
            className="w-full px-4 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-blue-500 outline-none mb-4"
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">Unlock Control Plane</button>
        </form>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-8 max-w-7xl mx-auto bg-[#0A101D] min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl text-slate-300">Connecting to Control Plane...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 dark:bg-[#0A101D] min-h-screen text-slate-800 dark:text-slate-100 font-sans">
      <header className="mb-6 flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            v2 Content Orchestrator
            {status.auto_mode ? 
              <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full border border-green-500/30">AUTO ON</span> : 
              <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full border border-red-500/30">AUTO OFF</span>
            }
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">DecisionGrid Execution Engine Control</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/leads"
            className="text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Leads
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("admin_token");
              setIsAuth(false);
            }}
            className="text-sm text-slate-500 hover:text-white"
          >
            Lock Interface
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* SEC 2: SYSTEM HEALTH */}
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatBox label="Pending" value={status.pending} />
          <StatBox label="Processing" value={status.processing} color="text-blue-500" />
          <StatBox label="Failed" value={status.failed} color="text-red-500" />
          <StatBox label="Generated Today" value={status.generated_today} color="text-green-500" />
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 lg:col-span-2 flex flex-col justify-center">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Cron Heartbeat</div>
            <div className="text-sm font-mono text-slate-300">
              {status.last_cron_run ? new Date(status.last_cron_run).toLocaleString() : 'No recent signal'}
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-2 mb-1">Worker Lock</div>
            <div className="text-sm font-mono text-slate-300">{status.lock_status}</div>
          </div>
        </div>

        {/* SEC 1: QUEUE CONTROLS */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest border-b dark:border-slate-700 pb-2">Manual Execution</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            <Btn action={() => handleAction("/api/control/run?limit=5", "run5")} loading={loadingAction === "run5"}>Run 5</Btn>
            <Btn action={() => handleAction("/api/control/run?limit=10", "run10")} loading={loadingAction === "run10"}>Run 10</Btn>
            <Btn action={() => handleAction("/api/control/run?limit=25", "run25")} loading={loadingAction === "run25"}>Run 25</Btn>
            <Btn action={() => handleAction("/api/control/run?limit=1000", "runAll")} color="bg-indigo-600 hover:bg-indigo-700" loading={loadingAction === "runAll"}>Run All</Btn>
          </div>

          <h2 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest border-b dark:border-slate-700 pb-2">Rapid Engine Controls</h2>
          <div className="flex gap-3 mb-4">
            <button 
              onClick={() => handleAction("/api/control/toggle-auto", "toggleAuto", { action: status.auto_mode ? 'OFF' : 'ON' })}
              disabled={loadingAction !== null}
              className={`flex-1 py-2 px-4 rounded font-bold transition-colors ${status.auto_mode ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'}`}
            >
              {status.auto_mode ? "Disable Auto Mode" : "Enable Auto Mode"}
            </button>
            <Btn action={() => handleAction("/api/control/reset", "reset")} color="bg-rose-600/20 text-rose-500 hover:bg-rose-600/30" loading={loadingAction === "reset"}>Reset Failed</Btn>
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Topic (e.g. RV Water Issues)" 
              value={seedPrompt} 
              onChange={e => setSeedPrompt(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
            <button 
              onClick={() => handleAction("/api/control/seed", "seed", { prompt: seedPrompt })}
              disabled={loadingAction === "seed"}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Seed
            </button>
          </div>
        </div>

        {/* SEC 4: LIVE LOGS */}
        <div className="lg:col-span-2 bg-black border border-slate-800 rounded-xl p-4 flex flex-col h-80">
          <div className="text-xs font-bold text-green-500 uppercase tracking-widest mb-2 flex items-center justify-between">
            <span>Live System Stream</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300">
            {logs.length === 0 ? <div className="text-slate-600 italic">Awaiting telemetry...</div> : logs.map((l, i) => (
              <div key={i} className="hover:bg-slate-900 px-1 rounded">{l}</div>
            ))}
          </div>
        </div>

        {/* SEC 6: AUDIT PANEL */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-96 flex flex-col">
          <h2 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest border-b dark:border-slate-700 pb-2">Audit: Latest Generated</h2>
          <div className="overflow-y-auto flex-1 pr-2">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase sticky top-0 bg-slate-800">
                <tr>
                  <th className="py-2">Slug</th>
                  <th className="py-2">Score</th>
                  <th className="py-2">Time</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-300">
                {pages.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-700/30">
                    <td className="py-2 text-blue-400 truncate max-w-[150px]" title={p.slug}>{p.slug}</td>
                    <td className="py-2">{p.quality_score || '-'}</td>
                    <td className="py-2 text-slate-500 text-xs">{new Date(p.created_at).toLocaleTimeString()}</td>
                    <td className="py-2 text-right">
                      <a href={`/${p.slug}`} target="_blank" className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SEC 5: FAILED JOBS */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-96 flex flex-col">
          <h2 className="text-sm font-bold text-red-500 mb-4 uppercase tracking-widest border-b dark:border-slate-700 pb-2">Failed Jobs ({failedJobs.length})</h2>
          <div className="overflow-y-auto flex-1 pr-2">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase sticky top-0 bg-slate-800">
                <tr>
                  <th className="py-2">Slug</th>
                  <th className="py-2">Attempts</th>
                  <th className="py-2">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-300">
                {failedJobs.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-700/30">
                    <td className="py-2 text-slate-200 truncate max-w-[120px]" title={f.proposed_slug}>{f.proposed_slug}</td>
                    <td className="py-2 text-center">{f.attempts}</td>
                    <td className="py-2 text-red-400 text-xs truncate max-w-[150px]" title={f.last_error}>{f.last_error}</td>
                  </tr>
                ))}
                {failedJobs.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-slate-500 italic">No failed jobs in queue.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatBox({ label, value, color = "text-slate-100" }: { label: string, value: any, color?: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-3xl font-black ${color}`}>{value || 0}</div>
    </div>
  );
}

function Btn({ children, action, color = "bg-blue-600 hover:bg-blue-700 text-white", loading }: { children: React.ReactNode, action: () => void, color?: string, loading?: boolean }) {
  return (
    <button 
      onClick={action} 
      disabled={loading}
      className={`${color} ${loading ? 'opacity-50 cursor-not-allowed' : ''} font-semibold py-2 px-4 rounded shadow-sm text-sm transition-colors`}
    >
      {loading ? "..." : children}
    </button>
  );
}
