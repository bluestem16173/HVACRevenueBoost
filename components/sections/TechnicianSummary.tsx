export default function TechnicianSummary({ data }: { data: any }) {
  const text = typeof data === "string" ? data : data?.text ?? "";
  if (!text) return null;
  return (
    <section className="mb-12">
      <div className="p-6 sm:p-8 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-hvac-brown-warm rounded-r-xl shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-hvac-brown dark:text-amber-200 mb-3">
          Technician Statement
        </h3>
        <p className="text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed m-0">{text}</p>
        <p className="text-xs font-bold text-hvac-brown dark:text-amber-200/80 mt-4 m-0 uppercase tracking-widest">
          — ASHRAE Fundamentals & Top Rated Local Techs
        </p>
      </div>
    </section>
  );
}
