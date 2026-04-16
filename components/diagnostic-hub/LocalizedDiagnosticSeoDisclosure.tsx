import Link from "next/link";
import type { ServiceVertical } from "@/lib/localized-city-path";
import {
  buildElectricalLocalizedPillarPath,
  buildHvacLocalizedPillarPath,
  buildPlumbingLocalizedPillarPath,
} from "@/lib/localized-city-path";
import { DiagnosticVerticalNav } from "@/components/diagnostic-hub/DiagnosticVerticalNav";

export type LocalizedDiagnosticChrome = {
  vertical: ServiceVertical;
  pillarSlug: string;
  citySlug: string;
  /** Display label, e.g. "Tampa, FL" */
  cityLabel: string;
};

function hubPath(vertical: ServiceVertical): string {
  if (vertical === "hvac") return "/hvac";
  if (vertical === "plumbing") return "/plumbing";
  return "/electrical";
}

function verticalLabel(vertical: ServiceVertical): string {
  if (vertical === "hvac") return "HVAC";
  if (vertical === "plumbing") return "Plumbing";
  return "Electrical";
}

function canonicalLocalUrl(vertical: ServiceVertical, pillarSlug: string, citySlug: string): string {
  if (vertical === "hvac") return buildHvacLocalizedPillarPath(pillarSlug, citySlug);
  if (vertical === "plumbing") return buildPlumbingLocalizedPillarPath(pillarSlug, citySlug);
  return buildElectricalLocalizedPillarPath(pillarSlug, citySlug);
}

/**
 * Breadcrumbs + pillar meta + “On this topic” — kept for SEO and IA,
 * collapsed so above-the-fold reads as a diagnostic tool, not a directory.
 */
export function LocalizedDiagnosticSeoDisclosure(props: LocalizedDiagnosticChrome) {
  const { vertical, pillarSlug, citySlug, cityLabel } = props;
  const vLabel = verticalLabel(vertical);
  const pillarHref = `/${vertical}/${pillarSlug}`;
  const localUrl = canonicalLocalUrl(vertical, pillarSlug, citySlug);

  return (
    <div className="space-y-5 text-slate-600 dark:text-slate-400">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
        <Link href="/" className="hover:text-hvac-blue dark:hover:text-hvac-gold">
          Home
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <Link href={hubPath(vertical)} className="hover:text-hvac-blue dark:hover:text-hvac-gold">
          {vLabel}
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <Link href={pillarHref} className="hover:text-hvac-blue dark:hover:text-hvac-gold">
          {pillarSlug.replace(/-/g, " ")}
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="font-medium text-slate-800 dark:text-slate-200">{cityLabel}</span>
      </nav>
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-500">
        National pillar:{" "}
        <Link href={pillarHref} className="font-medium text-hvac-blue hover:underline dark:text-hvac-gold">
          {pillarHref}
        </Link>
        <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">{localUrl}</span>
      </p>
      <DiagnosticVerticalNav vertical={vertical} pillarSlug={pillarSlug} citySlug={citySlug} />
    </div>
  );
}
