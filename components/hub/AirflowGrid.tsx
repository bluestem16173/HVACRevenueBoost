import { HubCard } from "./HubCard";
import { Wind, Fan, Filter, Activity, ChevronsDown, Diff } from "lucide-react";

const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("filter")) return <Filter className="w-6 h-6" />;
  if (t.includes("pressure")) return <Activity className="w-6 h-6" />;
  if (t.includes("distribution")) return <Diff className="w-6 h-6" />;
  if (t.includes("vent")) return <ChevronsDown className="w-6 h-6" />;
  if (t.includes("blocked")) return <Fan className="w-6 h-6" />;
  return <Wind className="w-6 h-6" />;
};

export type AirflowItem = {
  title: string;
  description: string;
  href: string;
};

export function AirflowGrid({ items }: { items: AirflowItem[] }) {
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
