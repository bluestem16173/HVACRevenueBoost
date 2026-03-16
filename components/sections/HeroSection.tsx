export default function HeroSection({ data, symptomName = "" }: { data: any; symptomName?: string }) {
  if (!data) return null;
  const title = data.title || symptomName;
  const description = data.description || "";
  return (
    <section className="mb-12">
      <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight m-0">
        {title}
      </h1>
      {description && (
        <div className="mt-6 text-gray-600 dark:text-slate-400 text-lg leading-relaxed">
          {description}
        </div>
      )}
    </section>
  );
}
