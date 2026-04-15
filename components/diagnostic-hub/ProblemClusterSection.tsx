import Link from "next/link";
import { ProblemCard } from "./ProblemCard";

export type ProblemClusterItem = { title: string; href: string };

export type ProblemClusterSectionProps = {
  icon: string;
  heading: string;
  items: ProblemClusterItem[];
  /** When omitted, no “view all” row is shown (plumbing / electrical hubs). */
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Optional anchor for in-page navigation. */
  sectionId?: string;
};

export function ProblemClusterSection({
  icon,
  heading,
  items,
  viewAllHref,
  viewAllLabel,
  sectionId,
}: ProblemClusterSectionProps) {
  return (
    <section id={sectionId} className="mb-10 scroll-mt-24">
      <h2 className="mb-4 flex flex-wrap items-center gap-2 text-lg font-bold text-hvac-navy dark:text-white sm:text-xl">
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
        <span>{heading}</span>
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <ProblemCard key={`${item.href}-${item.title}-${index}`} title={item.title} href={item.href} />
        ))}
      </div>
      {viewAllHref && viewAllLabel ? (
        <div className="mt-4">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-sm font-bold text-hvac-blue hover:underline"
          >
            {viewAllLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>
      ) : null}
    </section>
  );
}
