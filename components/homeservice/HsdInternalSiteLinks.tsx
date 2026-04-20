import Link from "next/link";
import { filterTierDiscoveryPaths } from "@/lib/seo/tier-one-discovery";

function asStrings(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 50);
}

function hrefForSlugPath(s: string): string {
  const t = s.trim();
  if (!t) return "#";
  return t.startsWith("/") ? t : `/${t}`;
}

function isHubLinks(links: Record<string, unknown>): boolean {
  const n = filterTierDiscoveryPaths(asStrings(links.related_symptoms)).length;
  return Array.isArray(links.related_symptoms) && n >= 2;
}

function HubLinkList({ title, paths }: { title: string; paths: string[] }) {
  if (!paths.length) return null;
  return (
    <div className="mt-3 first:mt-0">
      <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <ul className="flex flex-col gap-1.5 text-sm font-semibold text-hvac-blue">
        {paths.map((s) => (
          <li key={s}>
            <Link className="hover:underline" href={hrefForSlugPath(s)}>
              {s.replace(/^\//, "")}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HsdInternalSiteLinks({ data }: { data: Record<string, unknown> }) {
  const il = data.internal_links && typeof data.internal_links === "object" ? data.internal_links : null;
  const links = il as Record<string, unknown> | null;
  if (!links) return null;

  if (isHubLinks(links)) {
    const related = filterTierDiscoveryPaths(asStrings(links.related_symptoms));
    const causes = filterTierDiscoveryPaths(asStrings(links.causes));
    const repairs = filterTierDiscoveryPaths(asStrings(links.repair_guides));
    const systems = filterTierDiscoveryPaths(asStrings(links.system_pages));
    const context = filterTierDiscoveryPaths(asStrings(links.context_pages));
    if (!related.length) return null;

    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-900/80">
        <h2 className="mb-1 text-sm font-black text-hvac-navy dark:text-white">Related on this site</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Symptom → diagnosis → cause → repair — follow the graph for depth and next steps.
        </p>
        <HubLinkList title="Related symptoms" paths={related} />
        <HubLinkList title="Causes" paths={causes} />
        <HubLinkList title="Repair guides" paths={repairs} />
        <HubLinkList title="System pages" paths={systems} />
        <HubLinkList title="Context" paths={context} />
      </section>
    );
  }

  const legacyOk =
    typeof links.parent === "string" ||
    (Array.isArray(links.siblings) && asStrings(links.siblings).length > 0);
  if (!legacyOk) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-900/80">
      <h2 className="mb-2 text-sm font-black text-hvac-navy dark:text-white">Related on this site</h2>
      <ul className="flex flex-col gap-2 text-sm font-semibold text-hvac-blue">
        {typeof links.parent === "string" && links.parent.trim() ? (
          <li>
            <Link
              className="hover:underline"
              href={links.parent.trim().startsWith("/") ? links.parent : `/${links.parent}`}
            >
              Hub / parent
            </Link>
          </li>
        ) : null}
        {asStrings(links.siblings).map((s) => (
          <li key={s}>
            <Link className="hover:underline" href={s.startsWith("/") ? s : `/${s}`}>
              {s.replace(/^\//, "")}
            </Link>
          </li>
        ))}
        {typeof links.service === "string" && links.service.trim() ? (
          <li>
            <Link
              className="hover:underline"
              href={links.service.trim().startsWith("/") ? links.service : `/${links.service}`}
            >
              Service area
            </Link>
          </li>
        ) : null}
        {typeof links.authority === "string" && links.authority.trim() ? (
          <li>
            <Link
              className="hover:underline"
              href={links.authority.trim().startsWith("/") ? links.authority : `/${links.authority}`}
            >
              Deep guide
            </Link>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
