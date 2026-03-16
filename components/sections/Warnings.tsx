export default function Warnings({ data }: { data: any }) {
  if (!data) return null;
  const { ignore_risk, safety } = data;
  if (!ignore_risk && !safety) return null;
  return (
    <section className="mb-16">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-hvac-gold/50 p-8 rounded-2xl">
        <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-3">⚠️ What Happens If You Ignore This?</h2>
        <p className="text-slate-700 dark:text-slate-300 font-medium m-0">{ignore_risk}</p>
        {safety && (
          <p className="text-slate-700 dark:text-slate-300 font-medium mt-4 m-0">
            <strong>Safety:</strong> {safety}
          </p>
        )}
      </div>
    </section>
  );
}
