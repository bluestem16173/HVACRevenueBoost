import type { ServiceVertical } from "@/lib/localized-city-path";
import { electricalAnnexForSlug } from "@/src/lib/ai/prompts/hsdElectricalPromptAnnex";
import { hvacAnnexForSlug } from "@/src/lib/ai/prompts/hsdHvacPromptAnnex";
import { plumbingAnnexForSlug } from "@/src/lib/ai/prompts/hsdPlumbingPromptAnnex";

/** Per-vertical HSD user-message block (reduces cross-trade drift vs one monolithic brief). */
export function hsdVerticalPromptAnnex(vertical: ServiceVertical, storageSlug: string): string {
  switch (vertical) {
    case "hvac":
      return hvacAnnexForSlug(storageSlug);
    case "plumbing":
      return plumbingAnnexForSlug(storageSlug);
    case "electrical":
      return electricalAnnexForSlug(storageSlug);
  }
}
