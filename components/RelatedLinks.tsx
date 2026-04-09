export function RelatedLinks({ slugs }: { slugs: string[] }) {
  return (
    <section>
      <h3>Related HVAC Issues</h3>
      <ul>
        {slugs.map(s => (
          <li key={s}>
            <a href={`/diagnose/${s.replace('/diagnose/', '')}`}>
              {s.replace(/-/g, ' ')}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
