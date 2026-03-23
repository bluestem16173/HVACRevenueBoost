import { HubCard } from "./HubCard";
import { Snowflake, Flame, Wind, Droplets, Grid, Settings, Activity, Thermometer } from "lucide-react";

const iconMap: Record<string, any> = {
  ac: <Snowflake className="w-6 h-6" />,
  furnace: <Flame className="w-6 h-6" />,
  ventilation: <Wind className="w-6 h-6" />,
  water: <Droplets className="w-6 h-6" />,
  heatpump: <Activity className="w-6 h-6" />,
  thermostat: <Thermometer className="w-6 h-6" />,
  default: <Grid className="w-6 h-6" />
};

export type SystemItem = {
  title: string;
  description: string;
  href: string;
  iconType?: "ac" | "furnace" | "ventilation" | "water" | "heatpump" | "thermostat" | "default";
};

export function SystemOverviewGrid({ items }: { items: SystemItem[] }) {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, idx) => (
        <HubCard
          key={idx}
          title={item.title}
          description={item.description}
          href={item.href}
          icon={iconMap[item.iconType || "default"]}
        />
      ))}
    </div>
  );
}
