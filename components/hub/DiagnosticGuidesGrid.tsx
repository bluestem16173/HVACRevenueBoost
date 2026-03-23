import { HubCard } from "./HubCard";
import { Search, Activity, FileSearch, Stethoscope, Microscope } from "lucide-react";

export type GuideItem = {
  title: string;
  description: string;
  href: string;
};

export function DiagnosticGuidesGrid({ items }: { items: GuideItem[] }) {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, idx) => (
        <HubCard
          key={idx}
          title={item.title}
          description={item.description}
          href={item.href}
          icon={<Search className="w-6 h-6" />}
        />
      ))}
    </div>
  );
}
