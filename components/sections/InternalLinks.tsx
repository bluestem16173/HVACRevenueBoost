import Link from "next/link";

export default function InternalLinks({ data }: { data: any }) {
  const links = Array.isArray(data) ? data : [];
  if (links.length === 0) return null;
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Related Guides</h2>
      <div className="flex flex-wrap gap-3">
        {links.map((link: { type?: string; slug?: string; anchor?: string }, idx: number) => (
          <Link
            key={idx}
            href={`/${link.type || "diagnose"}/${link.slug}`}
            className="text-sm font-bold text-hvac-blue hover:underline"
          >
            {link.anchor || link.slug} →
          </Link>
        ))}
      </div>
    </section>
  );
}
