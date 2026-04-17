import type { ReactNode } from "react";

/** Gold / technical diagnostic layer. */
export function DGPro({ children }: { children: ReactNode }) {
  return (
    <div className="dg-pro">
      <p>{children}</p>
    </div>
  );
}

/** Blue / homeowner interpretation layer (indented). */
export function DGHome({ children }: { children: ReactNode }) {
  return (
    <div className="dg-home">
      <p>{children}</p>
    </div>
  );
}

/** Optional caution layer (deeper indent). */
export function DGRisk({ children }: { children: ReactNode }) {
  return (
    <div className="dg-risk">
      <p>{children}</p>
    </div>
  );
}

/** Renders pro → home → optional risk in locked visual order. */
export function renderDualLayer(pro: string, home?: string, risk?: string): ReactNode {
  const hp = home?.trim();
  const rp = risk?.trim();
  const pp = pro.trim();
  return (
    <>
      {pp ? <DGPro>{pp}</DGPro> : null}
      {hp ? <DGHome>{hp}</DGHome> : null}
      {rp ? <DGRisk>{rp}</DGRisk> : null}
    </>
  );
}
