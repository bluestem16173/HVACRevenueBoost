export default function FAQ({ data }: { data: any }) {
  const faq = Array.isArray(data) ? data : [];
  if (faq.length === 0) return null;
  return (
    <section className="mb-16" id="faq">
      <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-8">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faq.map((item: { question?: string; answer?: string }, idx: number) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 m-0">{item.question}</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2 m-0">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
