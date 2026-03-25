import Mermaid from "../Mermaid";

export default function SystemFlow({ chart }: { chart: string }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4">How It Works</h2>
      <Mermaid chart={chart} />
    </section>
  );
}
