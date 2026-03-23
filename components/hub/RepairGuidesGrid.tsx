import { HubCard } from "./HubCard";
import { Wrench, PenTool, Hammer } from "lucide-react";

export type RepairItem = {
  title: string;
  description: string;
  href: string;
};

export function RepairGuidesGrid({ items }: { items: RepairItem[] }) {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item, idx) => (
        <HubCard
          key={idx}
          title={item.title}
          description={item.description}
          href={item.href}
          icon={<Wrench className="w-6 h-6" />}
        />
      ))}
    </div>
  );
}
