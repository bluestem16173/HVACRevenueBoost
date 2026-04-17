import type { ReactNode } from "react";

export function DGSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={["dg-section", className].filter(Boolean).join(" ")}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
