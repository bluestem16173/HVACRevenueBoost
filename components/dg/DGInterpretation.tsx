import type { ReactNode } from "react";

export function DGInterpretation({ children }: { children: ReactNode }) {
  return (
    <div className="dg-interpret">
      <p className="dg-interpret__label">What this means for you</p>
      <div className="dg-interpret__body">
        {typeof children === "string" ? <p>{children}</p> : children}
      </div>
    </div>
  );
}
