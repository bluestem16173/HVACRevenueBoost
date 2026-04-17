export function DGNextStep({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="dg-next">
      <p>{text}</p>
    </div>
  );
}
