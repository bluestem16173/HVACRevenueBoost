/**
 * Maps known canonical leaf slugs to strong introductory hero sentences when AI copy falls short.
 */
export const diagnosticIntroCatalog: Record<string, string> = {
  // e.g. "ac-capacitor-failure": "Capacitor issues account for over 30% of AC service calls. Diagnosing this early can prevent severe compressor damage."
};

export function getFallbackIntro(slug: string): string | null {
  return diagnosticIntroCatalog[slug] || null;
}
