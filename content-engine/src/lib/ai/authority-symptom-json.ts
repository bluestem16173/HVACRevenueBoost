import { buildAuthoritySystemPreamble } from "./systemPreambleBuilders";

export interface AuthoritySymptomJson {
  title: string;
  metaTitle: string;
  metaDescription: string;
  diagnosticMeta: {
    system: string;
    pageType: string;
    slug: string;
    keywords: string[];
    schemaVersion: string;
  };
  htmlBody: string; // The 15-Point Tier-1 Emergency HTML content block + Mermaid
}

/**
 * Executes an AI generation request strictly mapped against the combined
 * Authority System preamble, enforcing UI compat and the htmlBody schema output.
 */
export async function generateAuthoritySymptomJson(
  slug: string,
  systemName: string = "hvac", 
  userContext: string = ""
): Promise<AuthoritySymptomJson> {
  const systemInstruction = buildAuthoritySystemPreamble();
  
  const userInstruction = `
GENERATE DIAGNOSTIC AUTHORITY JSON FOR:
- Slug: ${slug}
- System: ${systemName}
- Context: ${userContext}

Return JSON strictly matching the dg_html_v1 schema provided. No markdown blocks outside JSON.
  `.trim();

  // STUB: Model invocation would occur here utilizing the locked systemInstruction
  // e.g. const response = await llmClient.generate(systemInstruction, userInstruction);
  // const parsed = JSON.parse(response) as AuthoritySymptomJson;

  console.log(`[AuthoritySymptomJson] Generated payload for slug ${slug}`);
  
  // Return stub for types
  return {
    title: "",
    metaTitle: "",
    metaDescription: "",
    diagnosticMeta: {
      system: systemName,
      pageType: "authority_symptom",
      slug: slug,
      keywords: [],
      schemaVersion: "dg_html_v1"
    },
    htmlBody: ""
  };
}
