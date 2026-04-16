import { enforceStoredSlug } from "@/lib/slug-utils";

/**
 * Extra REQUIREMENTS merged into DG_AUTHORITY_V3 user prompt for high-value
 * symptom × city combos (see `getDgAuthorityV3SceneRequirementsBlock`).
 */

const DG_SCENE_TAMPA_AC_NOT_COOLING = `
* Tampa has high heat + high humidity → emphasize airflow + latent load issues in summary, paths, and costs where relevant.
* Most likely cause in summary_30s should lean toward airflow restriction first, then refrigerant (state both priorities clearly).
* decision_tree_mermaid MUST start with homeowner branches for:
  * Is air coming from vents?
  * Is air cold?
* Include 3–5 paths covering at least these concepts (use kebab-case id values):
  * low airflow
  * refrigerant issue
  * electrical/control issue
  * system struggling under peak heat
* quick_checks MUST explicitly cover: filter, vents, thermostat, outdoor unit fan (one check per line or clearly named).
* technician_section.what_they_measure MUST include: superheat, subcooling, suction/head pressure, amp draw (as separate bullets or tight phrases).
* costs.items should reflect Tampa residential HVAC market (bands, not fake precision).
`.trim();

const DG_SCENE_FORT_MYERS_AC_NOT_TURNING_ON = `
* Southwest Florida heat → treat as high urgency in summary_30s tone (calm, not alarmist): system failure = immediate discomfort.
* Most likely causes to foreground in order: thermostat issue → breaker/power → capacitor or contactor failure (plain English first).
* decision_tree_mermaid MUST include branches for:
  * Is thermostat on?
  * Is system getting power?
  * Does outdoor unit start?
* Include 3–5 paths covering at least these concepts (kebab-case id):
  * thermostat / control issue
  * power / breaker issue
  * capacitor / contactor failure
  * blower motor failure
* quick_checks MUST include: thermostat settings, breaker panel, outdoor unit sound/fan.
* technician_section.what_they_measure MUST include: voltage checks (24V + line voltage), capacitor testing, contactor inspection, amp draw.
* costs.items should include realistic bands for: capacitor replacement, electrical diagnostics, blower repair (Fort Myers / SWFL residential).
* Style: very clear and direct — homeowner is stressed; explain "why it won't turn on" in simple terms before technical depth.
`.trim();

/**
 * Returns extra REQUIREMENTS text for the LLM, or "" when no locked scenario applies.
 */
export function getDgAuthorityV3SceneRequirementsBlock(
  slug: string,
  locationDisplay: string,
  primaryIssue?: string | null
): string {
  const s = enforceStoredSlug(slug).toLowerCase();
  const loc = (locationDisplay || "").toLowerCase();
  const issue = (primaryIssue || "").toLowerCase();

  const coolingTampaSlug = s.includes("ac-not-cooling") && s.includes("tampa-fl");
  const coolingTampaLoose =
    loc.includes("tampa") &&
    (issue.includes("not cooling") || issue.includes("ac not cooling") || s.includes("ac-not-cooling"));

  const notOnFmSlug = s.includes("ac-not-turning-on") && s.includes("fort-myers-fl");
  const notOnFmLoose =
    loc.includes("fort myers") &&
    (issue.includes("not turning on") ||
      issue.includes("won't turn on") ||
      issue.includes("wont turn on") ||
      s.includes("ac-not-turning-on"));

  if (coolingTampaSlug || (coolingTampaLoose && (loc.includes("fl") || loc.includes("florida")))) {
    return DG_SCENE_TAMPA_AC_NOT_COOLING;
  }
  if (notOnFmSlug || (notOnFmLoose && (loc.includes("fl") || loc.includes("florida")))) {
    return DG_SCENE_FORT_MYERS_AC_NOT_TURNING_ON;
  }
  return "";
}
