import { HubCard } from "./HubCard";
import { AlertTriangle, AlertOctagon, AlertCircle, Thermometer, Zap, Droplets } from "lucide-react";

const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("electric") || t.includes("power") || t.includes("wiring")) return <Zap className="w-6 h-6" />;
  if (t.includes("water") || t.includes("leak") || t.includes("drain")) return <Droplets className="w-6 h-6" />;
  if (t.includes("hot") || t.includes("cold") || t.includes("temperature")) return <Thermometer className="w-6 h-6" />;
  if (t.includes("fail") || t.includes("broken")) return <AlertOctagon className="w-6 h-6" />;
  if (t.includes("noise") || t.includes("smell")) return <AlertCircle className="w-6 h-6" />;
  return <AlertTriangle className="w-6 h-6" />;
};

export type ProblemItem = {
  title: string;
  description: string;
  href: string;
};

export function CommonProblemsGrid({ items }: { items: ProblemItem[] }) {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, idx) => (
        <HubCard
          key={idx}
          title={item.title}
          description={item.description}
          href={item.href}
          icon={getIcon(item.title)}
        />
      ))}
    </div>
  );
}
