import raw from "../../prompts/DG_Authority_Generation_Queue.json";

/**
 * One row from `prompts/DG_Authority_Generation_Queue.json` — pipeline input for `dg_authority_v3` supporting pages.
 * `slug` is logical path without leading slash (matches `pagePath` base).
 */
export type DgAuthorityGenerationQueueEntry = {
  trade: "hvac" | "plumbing" | "electrical";
  slug: string;
  title: string;
  /** Editorial / grouping hint for `start_here_groups` on pillar pages — not validated in JSON schema. */
  cluster: string;
  /** Pillar hub path segment (e.g. `hvac/why-ac-isnt-cooling`) for `pillar_page` href `/…`. */
  pillar: string;
  mermaid: "hvac_v1" | "plumbing_v1" | "electrical_v1";
};

export type DgAuthorityGenerationQueueFile = {
  version: number;
  description: string;
  supporting_pages: DgAuthorityGenerationQueueEntry[];
};

const file = raw as DgAuthorityGenerationQueueFile;

/** Frozen 27-page generation queue (9 HVAC + 9 plumbing + 9 electrical). */
export const DG_AUTHORITY_GENERATION_QUEUE: readonly DgAuthorityGenerationQueueEntry[] =
  file.supporting_pages;

export const DG_AUTHORITY_GENERATION_QUEUE_META = {
  version: file.version,
  description: file.description,
} as const;
