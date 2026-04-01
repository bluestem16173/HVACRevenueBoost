/**
 * Content Operating System — registry facade for workers, orchestrator, and tooling.
 * Source of truth: `config/page-types.ts` — per-type files under `100KPageMaker/page-types/`;
 * structure map: `content-engine/pageframe/registry/`.
 */

export {
  PAGE_TYPES,
  PAGE_TYPE_ALIASES,
  normalizePageTypeKey,
  getPageTypeConfig,
  tryGetPageTypeConfig,
  type PageTypeDefinition,
  type PageTypeId,
  type GeneratorKind,
} from "@/config/page-types";

import {
  getPageTypeConfig,
  normalizePageTypeKey,
  type PageTypeDefinition,
  type PageTypeId,
} from "@/config/page-types";

/** Resolved config for a queue row (always returns a valid canonical id). */
export function resolveRegistryFromQueueJob(
  pageType: string | null | undefined,
  proposedSlug: string,
): PageTypeDefinition {
  const id = normalizePageTypeKey(pageType, proposedSlug);
  return getPageTypeConfig(id);
}

export function describeQueueJobForLogs(pageType: string | null | undefined, proposedSlug: string): string {
  const cfg = resolveRegistryFromQueueJob(pageType, proposedSlug);
  return `[${cfg.id}] gen=${cfg.generator} templates=${cfg.templates.slice(0, 2).join(",")}${cfg.templates.length > 2 ? "…" : ""}`;
}
