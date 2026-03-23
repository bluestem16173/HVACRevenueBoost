import { HubCard } from "./HubCard";
import { BookOpen, Award, GraduationCap, Microscope, Library, ShieldCheck, Thermometer, Info } from "lucide-react";

const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("seer") || t.includes("rating") || t.includes("efficiency")) return <Award className="w-6 h-6" />;
  if (t.includes("work") || t.includes("cycle")) return <Microscope className="w-6 h-6" />;
  if (t.includes("cause") || t.includes("failure")) return <ShieldCheck className="w-6 h-6" />;
  if (t.includes("thermodynamic") || t.includes("heat")) return <Thermometer className="w-6 h-6" />;
  if (t.includes("guide") || t.includes("learn")) return <GraduationCap className="w-6 h-6" />;
  return <BookOpen className="w-6 h-6" />;
};

export type AuthorityItem = {
  title: string;
  description: string;
  href: string;
};

export function AuthorityGrid({ items }: { items: AuthorityItem[] }) {
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
