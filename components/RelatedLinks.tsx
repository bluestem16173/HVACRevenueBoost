export function RelatedLinks({
  slugs,
  hrefPrefix = "/diagnose",
  heading = "Related issues",
}: {
  slugs: string[];
  /** e.g. `/hvac`, `/plumbing`, `/electrical`, or `/diagnose` */
  hrefPrefix?: string;
  heading?: string;
}) {
  const base = hrefPrefix.replace(/\/$/, "");
  return (
    <section>
      <h3>{heading}</h3>
      <ul>
        {slugs.map((s) => {
          const clean = s.replace(/^\/diagnose\//, "").replace(/^\//, "");
          return (
            <li key={s}>
              <a href={`${base}/${clean}`}>{clean.replace(/-/g, " ")}</a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
