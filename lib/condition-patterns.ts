/**
 * Condition pattern templates for generating contextual troubleshooting pages.
 * Format: {symptom} + pattern suffix → condition page
 * Used to expand search coverage without duplicate content.
 */

export const CONDITION_PATTERNS = [
  { suffix: "in extreme heat", slugSuffix: "in-extreme-heat" },
  { suffix: "but unit running", slugSuffix: "but-unit-running" },
  { suffix: "but fan running", slugSuffix: "but-fan-running" },
  { suffix: "after power outage", slugSuffix: "after-power-outage" },
  { suffix: "after filter change", slugSuffix: "after-filter-change" },
  { suffix: "upstairs only", slugSuffix: "upstairs-only" },
  { suffix: "downstairs only", slugSuffix: "downstairs-only" },
  { suffix: "some vents only", slugSuffix: "some-vents-only" },
  { suffix: "intermittent", slugSuffix: "intermittent" },
  { suffix: "sometimes working", slugSuffix: "sometimes-working" },
] as const;

export interface PatternCondition {
  slug: string;
  name: string;
  symptomId: string;
  symptomName: string;
  patternSuffix: string;
}

/**
 * Generate condition slugs/names from a symptom + pattern.
 * Used for programmatic condition page generation.
 */
export function generateConditionFromPattern(
  symptomId: string,
  symptomName: string,
  pattern: (typeof CONDITION_PATTERNS)[number]
): PatternCondition {
  const slug = `${symptomId.replace(/-/g, "-")}-${pattern.slugSuffix}`;
  const name = `${symptomName} ${pattern.suffix}`;
  return {
    slug,
    name,
    symptomId,
    symptomName,
    patternSuffix: pattern.suffix,
  };
}
