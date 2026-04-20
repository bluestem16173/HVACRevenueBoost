"use client";

export default function DiagnoseCatchAllError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-slate-800">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-wide text-red-900">Diagnose page error</p>
        <p className="mt-2 text-sm text-slate-700">{error.message || "Something went wrong while rendering this page."}</p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-slate-500">digest: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
