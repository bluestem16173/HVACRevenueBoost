import type { DgAuthorityCtaPayload } from "@/lib/dg/dgAuthorityCta";
import { DGCTA } from "@/components/dg/DGCTA";

/** Mid-page decision CTA (after repair matrix / cost awareness). */
export function DGMidCTA({ cta }: { cta: DgAuthorityCtaPayload }) {
  return <DGCTA {...cta} variant="mid" />;
}
