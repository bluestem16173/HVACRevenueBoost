import { buildDgAuthorityV3Page } from "@/lib/dg/buildDgAuthorityV3Page";
import {
  ELECTRICAL_CIRCUIT_OVERLOAD_TAMPA_V3,
  HVAC_AC_NOT_COOLING_TAMPA_V3,
  PLUMBING_WATER_HEATER_TAMPA_V3,
} from "./dgAuthorityV3Demos";

export type DgStructuredPreviewPage = {
  slug: string;
  label: string;
  vertical: "hvac" | "plumbing" | "electrical";
  data: Record<string, unknown>;
};

/** Preview pages: **dg_authority_v3** JSON built via {@link buildDgAuthorityV3Page}. */
export const DG_STRUCTURED_PREVIEW_PAGES: DgStructuredPreviewPage[] = [
  {
    slug: "hvac-ac-not-cooling-tampa",
    label: "HVAC · AC not cooling · Tampa",
    vertical: "hvac",
    data: buildDgAuthorityV3Page(HVAC_AC_NOT_COOLING_TAMPA_V3),
  },
  {
    slug: "plumbing-water-heater-tampa",
    label: "Plumbing · Water heater · Tampa",
    vertical: "plumbing",
    data: buildDgAuthorityV3Page(PLUMBING_WATER_HEATER_TAMPA_V3),
  },
  {
    slug: "electrical-circuit-overload-tampa",
    label: "Electrical · Circuit overload · Tampa",
    vertical: "electrical",
    data: buildDgAuthorityV3Page(ELECTRICAL_CIRCUIT_OVERLOAD_TAMPA_V3),
  },
];
