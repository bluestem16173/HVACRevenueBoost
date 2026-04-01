/**
 * Future: persist in `page_targets` (or extend generation_queue) for SEO-prioritized builds.
 * Orchestrator pulls targets instead of ad-hoc slug lists.
 */
export interface PageTarget {
  slug: string;
  page_type: string;
  /** symptom | cause | system | … */
  entity?: string;
  entity_id?: number;
  priority?: number;
  /** Optional graph / campaign id */
  campaign_id?: string;
}
