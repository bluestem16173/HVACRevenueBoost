export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validatePage(page: any): ValidationResult {
  const errors: string[] = [];

  if (!page) {
    errors.push('No page data provided to validator');
    return { valid: false, errors };
  }

  // Handle both raw row layout and isolated content json
  const content = page.content_json || page;

  // 🔒 Schema version check
  if (content?.schemaVersion !== 'v1') {
    errors.push('Invalid or missing schemaVersion: must be v1');
  }

  // 🔒 Required top-level fields (if it's a DB row)
  if (page.slug === "") errors.push('Empty slug');
  if (page.title === "") errors.push('Empty title');

  // 🔒 Core content checks tailored to v2_goldstandard schema
  if (!content) {
    errors.push('Missing content_json payload entirely');
  } else {
    // Structural presence
    if (!content.ai_summary || !content.ai_summary.most_likely_issue) {
      errors.push('Missing or malformed ai_summary.most_likely_issue');
    }
    
    // Thin content check
    const rawString = JSON.stringify(content);
    if (rawString.length < 1000) {
      errors.push(`Content too thin (length: ${rawString.length}, expected >1000)`);
    }

    // Causes array (Must have at least 1)
    if (!content.causes || !Array.isArray(content.causes) || content.causes.length < 1) {
      errors.push('Not enough basic causes (requires at least 1)');
    }

    // Deep dive causes (Must have at least 1)
    if (!content.deep_causes || !Array.isArray(content.deep_causes) || content.deep_causes.length < 1) {
      errors.push('Not enough deep_causes (requires at least 1)');
    }
    
    // Diagnostic Flow logic must exist
    if (!content.diagnostic_flow) {
      errors.push('Missing diagnostic_flow routing');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
