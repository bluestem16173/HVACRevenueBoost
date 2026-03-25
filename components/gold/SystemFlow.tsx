import Mermaid from "../Mermaid";

export default function SystemFlow({ chart }: { chart: string }) {
  return (
    <section className="mb-10">
      <p className="text-sm text-slate-600 mb-3 font-semibold ml-1">
        Follow this step-by-step diagnostic path to isolate the issue.
      </p>
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-hvac-navy text-white px-4 py-3 text-sm font-semibold tracking-widest uppercase">
          System Flow Overview
        </div>

        <div className="p-6 bg-white overflow-x-auto w-full">
          <Mermaid chart={chart} />
        </div>
      </div>
    </section>
  );
}
