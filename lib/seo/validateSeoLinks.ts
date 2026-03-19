import { SeoLinks, LinkItem } from "./types";

export function validateSeoLinks(data: any): SeoLinks {
  const seenSlugs = new Set<string>();
  const seenAnchors = new Set<string>();

  const safeArray = (arr: any, limit: number): LinkItem[] => {
    if (!Array.isArray(arr)) return [];
    
    const valid: LinkItem[] = [];
    for (const l of arr) {
      if (!l || !l.slug || !l.anchor) continue;
      
      const slugKey = l.slug.toLowerCase().trim();
      const anchorKey = l.anchor.toLowerCase().trim();
      
      if (seenSlugs.has(slugKey) || seenAnchors.has(anchorKey)) {
        continue; // dedupe
      }
      
      seenSlugs.add(slugKey);
      seenAnchors.add(anchorKey);
      valid.push({
        slug: l.slug,
        path: l.path || ("/" + l.slug),
        anchor: l.anchor,
        reason: l.reason
      });
      
      if (valid.length >= limit) break;
    }
    return valid;
  };

  return {
    page_slug: data?.page_slug || "",
    page_type: data?.page_type || "",

    link_strategy_summary: {
      primary_cluster_focus: data?.link_strategy_summary?.primary_cluster_focus || "",
      secondary_cluster_focus: data?.link_strategy_summary?.secondary_cluster_focus || "",
      total_contextual_links: data?.link_strategy_summary?.total_contextual_links || 0,
      total_section_links: data?.link_strategy_summary?.total_section_links || 0,
      notes: data?.link_strategy_summary?.notes || ""
    },

    contextual_links: {
      quick_answer: safeArray(data?.contextual_links?.quick_answer, 2),
      short_explanation: safeArray(data?.contextual_links?.short_explanation, 2),
      likely_causes: safeArray(data?.contextual_links?.likely_causes, 2),
      diagnostic_steps: safeArray(data?.contextual_links?.diagnostic_steps, 2),
      faq_or_supporting_copy: safeArray(data?.contextual_links?.faq_or_supporting_copy, 2)
    },

    section_links: {
      components_section: safeArray(data?.section_links?.components_section, 4),
      repairs_section: safeArray(data?.section_links?.repairs_section, 4),
      related_problems_section: safeArray(data?.section_links?.related_problems_section, 4)
    },

    entity_connections: {
      related_symptoms: safeArray(data?.entity_connections?.related_symptoms, 5),
      related_causes: safeArray(data?.entity_connections?.related_causes, 4),
      related_repairs: safeArray(data?.entity_connections?.related_repairs, 4),
      related_components: safeArray(data?.entity_connections?.related_components, 4),
      related_guides: safeArray(data?.entity_connections?.related_guides, 3)
    },

    injection_rules: data?.injection_rules || {
      max_links_per_short_paragraph: 1,
      max_total_contextual_links: 5,
      max_total_section_links: 10,
      avoid_repeating_same_anchor: true,
      avoid_duplicate_slug_across_sections: true,
      prefer_high_relevance_near_top: true
    }
  };
}
