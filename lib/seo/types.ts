export type LinkItem = {
  slug: string;
  path: string;
  anchor: string;
  reason?: string;
};

export type ContextualLinks = {
  quick_answer: LinkItem[];
  short_explanation: LinkItem[];
  likely_causes: LinkItem[];
  diagnostic_steps: LinkItem[];
  faq_or_supporting_copy: LinkItem[];
};

export type SectionLinks = {
  components_section: LinkItem[];
  repairs_section: LinkItem[];
  related_problems_section: LinkItem[];
};

export type EntityConnections = {
  related_symptoms: LinkItem[];
  related_causes: LinkItem[];
  related_repairs: LinkItem[];
  related_components: LinkItem[];
  related_guides: LinkItem[];
};

export type InjectionRules = {
  max_links_per_short_paragraph: number;
  max_total_contextual_links: number;
  max_total_section_links: number;
  avoid_repeating_same_anchor: boolean;
  avoid_duplicate_slug_across_sections: boolean;
  prefer_high_relevance_near_top: boolean;
};

export type SeoLinks = {
  page_slug: string;
  page_type: string;
  link_strategy_summary: {
    primary_cluster_focus: string;
    secondary_cluster_focus: string;
    total_contextual_links: number;
    total_section_links: number;
    notes: string;
  };
  contextual_links: ContextualLinks;
  section_links: SectionLinks;
  entity_connections: EntityConnections;
  injection_rules: InjectionRules;
};
