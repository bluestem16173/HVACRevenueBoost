import { HubCard } from "./HubCard";
import { Settings, Cpu, Database, Disc, Server } from "lucide-react";

export type ComponentItem = {
  title: string;
  description: string;
  href: string;
};

export function ComponentFailuresGrid({ items }: { items: ComponentItem[] }) {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item, idx) => (
        <HubCard
          key={idx}
          title={item.title}
          description={item.description}
          href={item.href}
          icon={<Cpu className="w-6 h-6" />}
        />
      ))}
    </div>
  );
}
