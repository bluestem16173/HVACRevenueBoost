export function DGFailureCluster({ title, text }: { title: string; text: string }) {
  return (
    <div className="dg-failure">
      {title ? <h3>{title}</h3> : null}
      {text ? <p>{text}</p> : null}
    </div>
  );
}
