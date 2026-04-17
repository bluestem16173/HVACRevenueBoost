export function DGHero({ title, summary }: { title: string; summary: string }) {
  return (
    <section className="dg-hero">
      {title ? <h1>{title}</h1> : null}
      {summary ? <p className="dg-summary">{summary}</p> : null}
    </section>
  );
}
