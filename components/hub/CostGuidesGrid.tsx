import { HubCard } from "./HubCard";
import { DollarSign, Banknote, Coins, Receipt, Wallet, TrendingDown } from "lucide-react";

const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("replace")) return <Banknote className="w-6 h-6" />;
  if (t.includes("repair")) return <Wallet className="w-6 h-6" />;
  if (t.includes("service") || t.includes("call")) return <Receipt className="w-6 h-6" />;
  if (t.includes("recharge") || t.includes("refrigerant")) return <Coins className="w-6 h-6" />;
  if (t.includes("save") || t.includes("efficiency")) return <TrendingDown className="w-6 h-6" />;
  return <DollarSign className="w-6 h-6" />;
};

export type CostItem = {
  title: string;
  description: string;
  href: string;
};

export function CostGuidesGrid({ items }: { items: CostItem[] }) {
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
