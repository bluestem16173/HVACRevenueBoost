"use client";

import { useState } from "react";
import Link from "next/link";

const DEFAULT_SLUG = "ac-blowing-warm-air";

export default function TestGeneratePage() {
  const [slug, setSlug] = useState(DEFAULT_SLUG);
  const [preview, setPreview] = useState<{ html: string; aiData: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ id: number; slug: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    setPreview(null);
    setSaved(null);
    try {
      const res = await fetch(`/api/preview-generate?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Preview failed");
      setPreview({ html: data.html, aiData: data.aiData });
    } catch (e: any) {
      setError(e?.message || "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Save failed");
      setSaved({ id: data.id, slug: data.slug });
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/test-db" className="text-blue-600 hover:underline text-sm">
            ← Test DB
          </Link>
          <h1 className="text-2xl font-bold text-hvac-navy dark:text-white">
            Test Generate — Preview Before Save
          </h1>
        </div>

        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
          Enter a symptom slug, preview the generated content, then save to DB when satisfied.
        </p>

        {/* Form */}
        <section className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200">
          <label className="block text-sm font-medium mb-2">Symptom slug</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ac-blowing-warm-air"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handlePreview}
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Generating…" : "Preview"}
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-6 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            Saved: <a href={`/diagnose/${saved.slug}`} className="underline font-medium">/diagnose/{saved.slug}</a>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <section className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200">
            <h2 className="text-lg font-bold mb-4">Preview (test page)</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-xs">
              Review the content below. If it looks good, click Generate & Save.
            </p>
            <div
              className="prose prose-slate dark:prose-invert max-w-none mb-6 p-6 border border-slate-200 rounded-lg bg-slate-50 dark:bg-slate-800"
              dangerouslySetInnerHTML={{ __html: preview.html }}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Generate & Save"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
