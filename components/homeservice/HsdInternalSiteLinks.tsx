import Link from "next/link";

function asStrings(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 50);
}

export function HsdInternalSiteLinks({ data }: { data: Record<string, unknown> }) {
  const il = data.internal_links && typeof data.internal_links === "object" ? data.internal_links : null;
  const links = il as Record<string, unknown> | null;
  if (!links || (typeof links.parent !== "string" && (!Array.isArray(links.siblings) || !links.siblings.length))) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-900/80">
      <h2 className="mb-2 text-sm font-black text-hvac-navy dark:text-white">Related on this site</h2>
      <ul className="flex flex-col gap-2 text-sm font-semibold text-hvac-blue">
        {typeof links.parent === "string" && links.parent.trim() ? (
          <li>
            <Link className="hover:underline" href={links.parent.trim().startsWith("/") ? links.parent : `/${links.parent}`}>
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
            <Link className="hover:underline" href={links.service.trim().startsWith("/") ? links.service : `/${links.service}`}>
              Service area
            </Link>
          </li>
        ) : null}
        {typeof links.authority === "string" && links.authority.trim() ? (
          <li>
            <Link className="hover:underline" href={links.authority.trim().startsWith("/") ? links.authority : `/${links.authority}`}>
              Deep guide
            </Link>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
