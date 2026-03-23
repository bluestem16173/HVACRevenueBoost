import Link from "next/link";
import { buildPagePath } from "@/lib/routing/build-page-path";

type PageType =
  | "system"
  | "symptom"
  | "diagnostic"
  | "cause"
  | "repair"
  | "context"
  | "component"
  | "condition";

interface RelatedPage {
  slug: string;
  title: string;
  page_type: PageType;
  site: "dg" | "hvac";
  city?: string | null;
}

interface RelatedLinksProps {
  title: string;
  items: RelatedPage[];
}

export function RelatedLinks({ title, items }: RelatedLinksProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border p-5">
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={`${item.page_type}-${item.slug}`}>
            <Link
              href={buildPagePath(item.page_type, item.slug, item.site, item.city)}
              className="hover:underline"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
