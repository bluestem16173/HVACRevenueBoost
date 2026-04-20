import { tierOneHvacRelatedIssueCardsForCity } from "@/lib/seo/tier-one-discovery";

/** In-market links for Tampa FL HVAC Tier-1 cluster (`/hvac/{symptom}/tampa-fl`). Matches HVAC core × `TIER_ONE_CITIES`. */
export const HVAC_TAMPA_RELATED_ISSUES: ReadonlyArray<{ href: string; label: string }> =
  tierOneHvacRelatedIssueCardsForCity("tampa-fl");
