export default function FastAnswer({ data }: { data: any }) {
  if (!data) return null;
  const text = data.summary || data.likely_cause || "";
  if (!text) return null;
  return (
    <section className="mb-12" id="fast-answer">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Fast Answer</h2>
      <div className="p-6 bg-hvac-blue/5 dark:bg-hvac-blue/10 border-l-4 border-hvac-blue rounded-r-xl">
        <p className="text-xl font-medium text-slate-800 dark:text-slate-200 m-0 leading-relaxed">{text}</p>
      </div>
    </section>
  );
}
