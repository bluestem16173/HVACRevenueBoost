export default function DiagnoseCatchAllLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10" aria-busy="true" aria-label="Loading diagnostic page">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-1/3 rounded bg-slate-200" />
        <div className="h-10 w-4/5 rounded bg-slate-200" />
        <div className="h-24 rounded-xl bg-slate-200" />
        <div className="h-48 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}
