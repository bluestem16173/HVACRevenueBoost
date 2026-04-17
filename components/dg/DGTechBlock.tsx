import type { ReactNode } from "react";

export function DGTechBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="dg-tech">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
