export default function CTA({ data }: { data: any }) {
  const primary = data?.primary;
  if (!primary) return null;
  return (
    <section className="mb-16" id="get-quote">
      <div className="bg-hvac-navy text-white p-10 md:p-14 rounded-3xl text-center">
        <h2 className="text-3xl md:text-5xl font-black m-0 mb-6 text-white">{primary}</h2>
        <button
          data-open-lead-modal
          className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-10 py-5 rounded-2xl uppercase tracking-widest text-lg"
        >
          Request Diagnostic Today
        </button>
      </div>
    </section>
  );
}
