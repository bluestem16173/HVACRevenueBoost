export type QualityResult = {
  score: number;
  status: 'draft' | 'noindex' | 'published' | 'needs_regen';
  breakdown: {
    completeness: number;
    depth: number;
    internalLinks: number;
    structure: number;
    confidence: number;
    hygiene: number;
  };
  reasons: string[];
};

export function calculateQualityScore(data: any, html: string = "", pageType: string = ""): QualityResult {
  const reasons: string[] = [];
  let completeness = 0; // max 30
  let depth = 0; // max 20
  let internalLinks = 0; // max 10
  let structure = 0; // max 20
  let confidence = 0; // max 10
  let hygiene = 10; // max 10 (starts at 10, penalties subtract)

  if (!data || typeof data !== 'object') {
    reasons.push("Data is empty or invalid format.");
    return {
      score: 0,
      status: 'needs_regen',
      breakdown: { completeness: 0, depth: 0, internalLinks: 0, structure: 0, confidence: 0, hygiene: 0 },
      reasons
    };
  }

  // 1. Completeness (0-30): Sections present
  const hasSummary = Boolean(data.summary || data.fastAnswer || data.fast_answer?.summary || data.quick_answer);
  const hasDiagnostic = Boolean(data.diagnosticFlowMermaid || data.diagnostic_steps || data.narrow_down);
  const hasToolsParts = Boolean(data.toolsRequired?.length > 0 || data.partsRequired?.length > 0 || data.repairs?.length > 0);
  const hasFaq = Boolean(data.faq?.length > 0 || data.tech_observation);

  // 🚨 RICH SCHEMA GATE: Symptom pages MUST have the strategic arrays
  if (pageType === 'symptom') {
    if (!data.system_explanation) { reasons.push('Missing system_explanation — score 0'); return { score: 0, status: 'needs_regen', breakdown: { completeness: 0, depth: 0, internalLinks: 0, structure: 0, confidence: 0, hygiene: 0 }, reasons }; }
    if (!data.repair_matrix) { reasons.push('Missing repair_matrix — score 0'); return { score: 0, status: 'needs_regen', breakdown: { completeness: 0, depth: 0, internalLinks: 0, structure: 0, confidence: 0, hygiene: 0 }, reasons }; }
    if (!data.environments) { reasons.push('Missing environments — score 0'); return { score: 0, status: 'needs_regen', breakdown: { completeness: 0, depth: 0, internalLinks: 0, structure: 0, confidence: 0, hygiene: 0 }, reasons }; }
  }

  if (hasSummary) completeness += 10; else reasons.push("Missing fast answer / summary.");
  if (hasDiagnostic) completeness += 10; else reasons.push("Missing diagnostic flow or steps.");
  if (hasToolsParts || hasFaq) completeness += 10;

  // 2. Depth / Word count (0-20)
  const contentLen = html.length + JSON.stringify(data).length;
  if (contentLen > 4000) {
    depth = 20;
  } else if (contentLen > 2500) {
    depth = 15;
  } else if (contentLen > 1000) {
    depth = 10;
  } else {
    depth = 5;
    reasons.push("Content is too shallow (< 1000 chars).");
  }

  // 3. Internal Links (0-10)
  // Check if seoLinks or related arrays are populated
  const seo = data.seo_links || data.seoLinks;
  const linksCt = (seo?.link_strategy_summary?.total_contextual_links || 0) + 
                  (seo?.link_strategy_summary?.total_section_links || 0) +
                  (data.relatedSymptoms?.length || 0);
  if (linksCt >= 3) {
    internalLinks = 10;
  } else if (linksCt > 0) {
    internalLinks = 5;
  } else {
    reasons.push("Poor internal linking (0-2 related links).");
  }

  // 4. Content Uniqueness / Structure (0-20)
  // Check sufficient causes and repairs  // 4. Content Uniqueness / Structure (0-20)
  let causeCount = 0;
  if (Array.isArray(data.systemCards)) causeCount += data.systemCards.length;
  if (Array.isArray(data.top_causes)) causeCount += data.top_causes.length;
  if (Array.isArray(data.causes)) causeCount += data.causes.length;
  if (Array.isArray(data.primaryCauses)) causeCount += data.primaryCauses.length;

  let repairCount = 0;
  if (Array.isArray(data.repairOptions)) repairCount += data.repairOptions.length;
  if (Array.isArray(data.repairs)) repairCount += data.repairs.length;
  if (data.repair_matrix?.electrical?.length === 3) repairCount += 9; // full matrix = 9 total
  if (Array.isArray(data.stepsOverview)) repairCount += data.stepsOverview.length;

  if (causeCount >= 3) structure += 10;
  else { reasons.push("Too few causes (need at least 3)."); structure += Math.max(0, causeCount * 3); }

  if (repairCount >= 3) structure += 10;
  else { reasons.push("Too few repairs/steps (need at least 3)."); structure += Math.max(0, repairCount * 3); }

  // 5. Confidence Score Present (0-10)
  if (data.confidence_score !== undefined || data.severity_indicator || data.riskLevel || data.tech_observation) {
    confidence = 10;
  } else {
    reasons.push("Missing AI confidence score or risk level indicators.");
  }

  // 6. Placeholder Penalty / Hygiene (0-10)
  const strData = JSON.stringify(data).toLowerCase();
  if (strData.includes("placeholder") || strData.includes("lorem ipsum") || strData.includes("generic")) {
    hygiene = 0;
    reasons.push("Placeholder or generic text detected in payload.");
  }

  // 7. Structural Penalties (Legacy Kill)
  let structuralPenalty = 0;
  if (data.systems) {
    structuralPenalty += 50;
    reasons.push("Legacy 'systems' structure detected (-50).");
  }
  
  if (pageType === 'repair') {
    if (!data.steps) {
      structuralPenalty += 40;
      reasons.push("Missing 'steps' for repair page (-40).");
    }
    if (!data.tools_required) {
      structuralPenalty += 20;
      reasons.push("Missing 'tools_required' for repair page (-20).");
    }
  } else if (pageType === 'symptom') {
    if (!data.top_causes) {
      structuralPenalty += 30;
      reasons.push("Missing 'top_causes' for symptom page (-30).");
    }
  } else if (pageType === 'cause') {
    if (!data.diagnostic_tests) {
      structuralPenalty += 30;
      reasons.push("Missing 'diagnostic_tests' for cause page (-30).");
    }
  }

  let totalScore = completeness + depth + internalLinks + structure + confidence + hygiene - structuralPenalty;
  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  let status: 'draft' | 'noindex' | 'published' | 'needs_regen' = 'published';

  if (totalScore < 40) {
    status = 'needs_regen';
    reasons.push(`Score too low (${totalScore}). Critical failure.`);
  } else if (totalScore < 60) {
    status = 'noindex';
    reasons.push(`Score indicates weak page (${totalScore}). Marked as noindex.`);
  } else if (totalScore < 80) {
    status = 'published'; // Mid tier
    reasons.push(`Mid-tier page (${totalScore}). Ok to index with soft monetization.`);
  } else {
    status = 'published'; // High tier
  }

  // Immediately flag for regeneration if the generator pipeline detected fragile schema arrays
  if (data._quality_flags && Array.isArray(data._quality_flags) && data._quality_flags.length > 0) {
    status = 'needs_regen';
    reasons.push(`Quality flags triggered regen: ${data._quality_flags.join(', ')}`);
  }

  return {
    score: totalScore,
    status,
    breakdown: {
      completeness,
      depth,
      internalLinks,
      structure,
      confidence,
      hygiene
    },
    reasons
  };
}
