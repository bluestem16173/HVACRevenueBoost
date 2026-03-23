import { HubCard } from "./HubCard";
import { Zap, AlertTriangle, PowerOff, BatteryCharging, Cable, ShieldAlert } from "lucide-react";

const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("capacitor") || t.includes("battery")) return <BatteryCharging className="w-6 h-6" />;
  if (t.includes("wire") || t.includes("cable") || t.includes("lug")) return <Cable className="w-6 h-6" />;
  if (t.includes("trip") || t.includes("breaker") || t.includes("ground")) return <PowerOff className="w-6 h-6" />;
  if (t.includes("voltage") || t.includes("transformer")) return <Zap className="w-6 h-6" />;
  if (t.includes("relay") || t.includes("contactor")) return <AlertTriangle className="w-6 h-6" />;
  return <ShieldAlert className="w-6 h-6" />;
};

export type ElectricalItem = {
  title: string;
  description: string;
  href: string;
};

export function ElectricalGrid({ items }: { items: ElectricalItem[] }) {
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
