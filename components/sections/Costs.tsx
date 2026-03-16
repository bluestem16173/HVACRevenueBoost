export default function Costs({ data }: { data: any }) {
  if (!data) return null;
  const { diy, moderate, professional } = data;
  if (!diy && !moderate && !professional) return null;
  return (
    <section className="mb-16" id="cost">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Typical Repair Costs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {diy && (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 p-6 rounded-xl">
            <h3 className="text-sm font-black text-green-800 uppercase tracking-widest mb-2">DIY / Low</h3>
            <p className="text-3xl font-black text-slate-800 m-0">{diy}</p>
          </div>
        )}
        {moderate && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 p-6 rounded-xl">
            <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-2">Moderate</h3>
            <p className="text-3xl font-black text-slate-800 m-0">{moderate}</p>
          </div>
        )}
        {professional && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 p-6 rounded-xl">
            <h3 className="text-sm font-black text-red-800 uppercase tracking-widest mb-2">Professional</h3>
            <p className="text-3xl font-black text-slate-800 m-0">{professional}</p>
          </div>
        )}
      </div>
    </section>
  );
}
