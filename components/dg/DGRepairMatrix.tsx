export function DGRepairMatrix({ items }: { items: string[] }) {
  return (
    <div className="dg-repair">
      <h3>Repair Matrix</h3>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
