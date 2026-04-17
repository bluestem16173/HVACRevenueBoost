import Link from "next/link";
import type { DgRelatedDiagnosticRef } from "@/lib/dg/dgAuthorityGraph";

function splitByRole(pages: DgRelatedDiagnosticRef[]) {
  const siblings = pages.filter((p) => !p.role || p.role === "sibling");
  const pillarHubs = pages.filter((p) => p.role === "pillar");
  const costReplace = pages.filter((p) => p.role === "cost" || p.role === "escalation");
  return { siblings, pillarHubs, costReplace };
}

/**
 * Bottom “Related diagnostics” block — URLs + titles only; no body injection.
 * When {@link DgRelatedDiagnosticRef.role} is set: **Related symptoms**, **Pillar / system**, **Cost / replace**.
 */
export function DGRelatedPages({ pages }: { pages: DgRelatedDiagnosticRef[] }) {
  if (pages.length < 2) return null;

  const { siblings, pillarHubs, costReplace } = splitByRole(pages);
  const grouped = pillarHubs.length > 0 || costReplace.length > 0;

  const list = (items: DgRelatedDiagnosticRef[]) => (
    <ul className="dg-related-diagnostics__list">
      {items.map((p) => (
        <li key={p.href}>
          <Link href={p.href} className="dg-related-diagnostics__link">
            {p.title}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="dg-related-diagnostics" aria-label="Related diagnostics">
      <h3 className="dg-related-diagnostics__title">Related diagnostics</h3>
      {grouped ? (
        <div className="dg-related-diagnostics__groups space-y-6">
          {siblings.length > 0 ? (
            <div>
              <h4 className="dg-related-diagnostics__subtitle">Related symptoms</h4>
              {list(siblings)}
            </div>
          ) : null}
          {pillarHubs.length > 0 ? (
            <div>
              <h4 className="dg-related-diagnostics__subtitle">Pillar / system links</h4>
              {list(pillarHubs)}
            </div>
          ) : null}
          {costReplace.length > 0 ? (
            <div>
              <h4 className="dg-related-diagnostics__subtitle">Cost / replace links</h4>
              {list(costReplace)}
            </div>
          ) : null}
        </div>
      ) : (
        list(pages)
      )}
    </section>
  );
}
