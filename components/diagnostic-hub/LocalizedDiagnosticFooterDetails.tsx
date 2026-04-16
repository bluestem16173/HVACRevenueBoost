import { RelatedLinks } from "@/components/RelatedLinks";
import {
  LocalizedDiagnosticSeoDisclosure,
  type LocalizedDiagnosticChrome,
} from "@/components/diagnostic-hub/LocalizedDiagnosticSeoDisclosure";

type Props = {
  chrome: LocalizedDiagnosticChrome;
  related: string[];
  relatedPrefix: string;
  relatedHeading: string;
  /** e.g. JSON internal links block for HSD pages */
  children?: React.ReactNode;
};

export function LocalizedDiagnosticFooterDetails({ chrome, related, relatedPrefix, relatedHeading, children }: Props) {
  return (
    <footer className="mx-auto max-w-4xl px-4 pb-16">
      <details className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="cursor-pointer select-none px-4 py-3 text-xs font-semibold text-slate-500 marker:content-none dark:text-slate-400 [&::-webkit-details-marker]:hidden">
          Page details &amp; related links
        </summary>
        <div className="space-y-6 border-t border-slate-100 px-4 py-5 dark:border-slate-800">
          <LocalizedDiagnosticSeoDisclosure {...chrome} />
          <RelatedLinks slugs={related} hrefPrefix={relatedPrefix} heading={relatedHeading} />
          {children}
        </div>
      </details>
    </footer>
  );
}
