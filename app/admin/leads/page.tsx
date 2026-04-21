"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { AdminLeadRow } from "@/lib/admin-leads-types";

export default function AdminLeadsPage() {
  const [token, setToken] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [leads, setLeads] = useState<AdminLeadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
      setIsAuth(true);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/leads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setIsAuth(false);
        localStorage.removeItem("admin_token");
        setError("Unauthorized — set admin token again.");
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || res.statusText);
      }
      const data = (await res.json()) as { leads: AdminLeadRow[] };
      setLeads(data.leads ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuth) void fetchLeads();
  }, [isAuth, fetchLeads]);

  const patchLead = async (id: string, action: "assign_bryan" | "mark_contacted") => {
    if (!token) return;
    setActingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      if (res.status === 401) {
        setIsAuth(false);
        localStorage.removeItem("admin_token");
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || res.statusText);
      }
      await fetchLeads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setActingId(null);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("admin_token", token.trim());
    setIsAuth(true);
  };

  if (!isAuth) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-slate-900">Admin — Leads</h1>
        <p className="mt-2 text-sm text-slate-600">Same token as Content Engine (`ADMIN_TOKEN`).</p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin bearer token"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
          <button type="submit" className="rounded-lg bg-hvac-navy px-4 py-2 font-semibold text-white">
            Save & continue
          </button>
        </form>
        <p className="mt-6 text-sm">
          <Link href="/admin/content-engine" className="text-blue-600 underline">
            Content Engine admin
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Leads</h1>
          <p className="text-sm text-slate-600">Fort Myers URL city → routed to Bryan; else lead pool.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void fetchLeads()}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh
          </button>
          <Link
            href="/admin/content-engine"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Content Engine
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-900">New leads</h2>

        {loading && leads.length === 0 ? (
          <p className="text-slate-500">Loading…</p>
        ) : leads.length === 0 ? (
          <p className="text-slate-500">No leads yet.</p>
        ) : (
          <ul className="space-y-4">
            {leads.map((l) => {
              const cityLabel = l.page_city_slug || l.city_slug || "—";
              const busy = actingId === l.id;
              return (
                <li
                  key={l.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="text-slate-900 dark:text-white">
                      {l.trade ?? "—"} — {cityLabel}
                    </strong>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {l.status ?? "—"}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-sm text-slate-700 dark:text-slate-300">{l.phone ?? "—"}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Routed: <span className="font-semibold text-slate-900 dark:text-slate-200">{l.routed_to}</span>
                    {l.assigned_vendor ? (
                      <>
                        {" "}
                        · Assigned:{" "}
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{l.assigned_vendor}</span>
                      </>
                    ) : null}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void patchLead(l.id, "assign_bryan")}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-bold text-amber-950 hover:bg-amber-400 disabled:opacity-50"
                    >
                      Assign Bryan
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void patchLead(l.id, "mark_contacted")}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      Mark contacted
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
