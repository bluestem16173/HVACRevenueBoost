import { headers } from "next/headers";

import { RelatedPagesSection } from "@/components/diagnose/RelatedPagesSection";
import { isTradeCatchallLocalPathname, pathnameToStorageSlugCandidate } from "@/lib/pathname-storage-slug";

export { pathnameToStorageSlugCandidate } from "@/lib/pathname-storage-slug";

/**
 * Renders `RelatedPagesSection` **between** `<main>` and `<footer>` when the URL maps to a storage slug
 * (`/electrical/…`, `/plumbing/…`, `/hvac/…`, or after `/diagnose/` / `/p/`), except three-segment
 * `/trade/symptom/city` catch-all URLs (those mount the section in `catchAllDbRoutes` instead).
 */
export async function FooterRelatedPagesSlot() {
  const pathname = (await headers()).get("x-pathname") || "/";
  /** City pages under `/trade/symptom/city` already include `RelatedPagesSection` in the page renderer. */
  if (isTradeCatchallLocalPathname(pathname)) return null;
  const slug = pathnameToStorageSlugCandidate(pathname);
  if (!slug) return null;

  return (
    <div className="border-t border-slate-200 bg-slate-50 py-6 dark:border-slate-800 dark:bg-slate-950">
      <RelatedPagesSection slug={slug} sectionClassName="mt-0" />
    </div>
  );
}
