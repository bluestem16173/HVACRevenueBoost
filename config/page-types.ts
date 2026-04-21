/**
 * Single source of truth for programmatic generation + routing metadata.
 * Orchestrator / workers should resolve `page_type` through {@link normalizePageTypeKey} and {@link getPageTypeConfig}.
 *
 * Per-type modules (schema/prompt/validator/template): `100KPageMaker/page-types/<id>/`
 * @see config/page-types-inventory.json — human-readable audit snapshot
 */

export type GeneratorKind =
  | "generateDiagnosticEngineJson"
  | "generateTwoStagePage"
  | "none";

export interface PageTypeDefinition {
  /** Canonical registry id */
  id: string;
  /** Values seen on generation_queue.page_type / pages.page_type */
  queueKeys: string[];
  /** App route patterns (Next.js) */
  routes: string[];
  /** Primary React components / templates (names only — actual imports stay in app/) */
  templates: string[];
  /** Optional: content JSON schema versions for /diagnose branching */
  schemaVersions?: string[];
  /** Code / docs pointers for prompts */
  promptDoc: string;
  /** Module paths for schema / normalization (informational) */
  schemaModule: string;
  /** Validator entry (informational — wire in worker) */
  validatorModule: string;
  generator: GeneratorKind;
  /** Short notes for operators */
  notes?: string;
}

export const PAGE_TYPES = {
  symptom: {
    id: "symptom",
    queueKeys: ["symptom", "diagnose", "diagnostic", "condition"],
    routes: ["/diagnose/[symptom]"],
    templates: ["DiagnosticGoldPage", "GoldStandardPage", "AuthoritySymptomPage", "MasterDecisionGridPage"],
    schemaVersions: [
      "v5_master",
      "v6_dg_hvac_hybrid",
      "v2_goldstandard",
      "authority_symptom",
      "decisiongrid_master",
      "dg_authority_v3",
    ],
    promptDoc: "lib/content-engine/prompts/hvac-revenue-boost.ts (default) | DECISIONGRID_DIAGNOSTIC_MODE for DG depth",
    schemaModule: "lib/content-engine/schema.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateDiagnosticEngineJson",
    notes: "Default diagnostic pipeline; inferDiagnosticSchemaVersion selects renderer.",
  },
  repair: {
    id: "repair",
    queueKeys: ["repair"],
    routes: ["/repair/[city]/[symptom]", "/repair/[city]", "/repair"],
    templates: ["emergency-page template", "city repair expansion"],
    promptDoc: "docs/DECISIONGRID-TEMPLATE-EXPORT.md (repair sections)",
    schemaModule: "lib/content-engine/schema.ts",
    validatorModule: "lib/validators/page-validator.ts",
    generator: "none",
    notes: "Layer 8: AI often skipped for repair/* slugs — template expansion.",
  },
  emergency: {
    id: "emergency",
    queueKeys: ["emergency"],
    routes: ["/emergency/[city]/[symptom]"],
    templates: ["templates/emergency-page.tsx"],
    promptDoc: "lib/content-engine/prompts/hvac-revenue-boost.ts (emergency blueprint)",
    schemaModule: "lib/content-engine/schema.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateDiagnosticEngineJson",
    notes: "Urgency + strong CTA; HRB default prompts.",
  },
  city_service: {
    id: "city_service",
    queueKeys: ["city_service", "city-service"],
    routes: ["/[symptom] hybrid city service", "/repair/[city]"],
    templates: ["HybridServicePageTemplate", "city service landing"],
    promptDoc: "lib/content-engine/prompts/hvac-revenue-boost.ts (city_service blueprint)",
    schemaModule: "lib/content-engine/schema.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateDiagnosticEngineJson",
    notes: "e.g. AC Repair Tampa FL — hook, trust, CTAs.",
  },
  city_symptom: {
    id: "city_symptom",
    queueKeys: ["city_symptom", "city-symptom"],
    routes: ["/repair/[city]/[symptom]"],
    templates: ["location symptom"],
    schemaVersions: ["hsd_city_diagnostic_v1"],
    promptDoc:
      "lib/content-engine/prompts/hvac-revenue-boost.ts (city_symptom blueprint) | lib/prompt-schema-router.ts HSD city JSON",
    schemaModule: "lib/schema/hsdCityDiagnosticPage.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateDiagnosticEngineJson",
    notes: "e.g. AC Not Cooling Tampa — fast answer, quick checks, service area.",
  },
  /** Home Service Diagnostic (HSD) authority engine — canonical successor to `hvac_authority_v3` queue label. */
  hsd: {
    id: "hsd",
    queueKeys: ["hsd", "hvac_authority_v3"],
    routes: ["/[...slug] (hvac/{pillar}/{city})", "/diagnose/[symptom]"],
    templates: ["HSDPage", "HSD locked JSON", "generateDiagnosticEngineJson + HSD_V2 prompt"],
    schemaVersions: ["hsd_v2"],
    promptDoc: "lib/prompt-schema-router.ts (HSD_V2) | lib/hsd/validatePage.ts",
    schemaModule: "lib/validation/hsdV25Schema.ts",
    validatorModule: "lib/hsd/validatePage.ts",
    generator: "generateDiagnosticEngineJson",
    notes: "Veteran-technician HSD v2 JSON; DB `page_type` may be `hsd` or legacy `city_symptom` with same schema.",
  },
  hybrid: {
    id: "hybrid",
    queueKeys: ["hybrid"],
    routes: ["/symptom/[symptom] (hybrid DB)"],
    templates: ["HybridServicePageTemplate"],
    promptDoc: "generateTwoStagePage hybrid branch — lib/content-engine/generator.ts",
    schemaModule: "templates/hybrid-service-page",
    validatorModule: "lib/content-engine/core validateContent",
    generator: "generateTwoStagePage",
    notes: "City / service hybrid pages via app/symptom/[symptom]/page.tsx + hybrid page_type.",
  },
  cause: {
    id: "cause",
    queueKeys: ["cause"],
    routes: ["/cause/[symptom]", "/causes/[symptom]"],
    templates: ["cause / causes templates"],
    promptDoc: "cause prompts in content-engine",
    schemaModule: "lib/content/normalizePageData.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateTwoStagePage",
    notes: "Two URL patterns — consider consolidating.",
  },
  system: {
    id: "system",
    queueKeys: ["system"],
    routes: ["/system/[symptom]"],
    templates: ["system hub template"],
    promptDoc: "system hub prompts",
    schemaModule: "lib/content-engine/schema.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateTwoStagePage",
    notes: "System-level hubs.",
  },
  hub: {
    id: "hub",
    queueKeys: ["hub"],
    routes: ["/hub/[symptom]"],
    templates: ["hub layout"],
    promptDoc: "hub prompts",
    schemaModule: "lib/content-engine/schema.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateTwoStagePage",
    notes: "Topical hubs.",
  },
  cluster: {
    id: "cluster",
    queueKeys: ["cluster"],
    routes: ["/cluster/[symptom]"],
    templates: ["cluster pages"],
    promptDoc: "cluster prompts",
    schemaModule: "lib/content-engine/schema.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateTwoStagePage",
    notes: "Clusters.",
  },
  authority: {
    id: "authority",
    queueKeys: ["authority"],
    routes: ["/authority/[symptom]"],
    templates: ["authority layout"],
    promptDoc: "authority branch in generateTwoStagePage",
    schemaModule: "lib/content-engine/schema.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateTwoStagePage",
    notes: "Authority conversion pages.",
  },
  component: {
    id: "component",
    queueKeys: ["component"],
    routes: ["/components/[symptom]"],
    templates: ["component detail"],
    promptDoc: "component prompts",
    schemaModule: "lib/content-engine/schema.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateTwoStagePage",
    notes: "Parts / components.",
  },
  location_hub: {
    id: "location_hub",
    queueKeys: ["location_hub"],
    routes: ["/locations/[city]"],
    templates: ["locations / city hub"],
    promptDoc: "location hub seed scripts",
    schemaModule: "lib/content/normalizePageData.ts",
    validatorModule: "lib/validators/page-validator.ts",
    generator: "generateTwoStagePage",
    notes: "Geo hubs.",
  },
  fix: {
    id: "fix",
    queueKeys: ["fix"],
    routes: ["/fix/[symptom]"],
    templates: ["fix / repair templates"],
    promptDoc: "fix prompts",
    schemaModule: "lib/content/normalizePageData.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateTwoStagePage",
    notes: "Fix-oriented.",
  },
  cost: {
    id: "cost",
    queueKeys: ["cost"],
    routes: ["/cost/[symptom]"],
    templates: ["cost pages"],
    promptDoc: "cost prompts",
    schemaModule: "lib/content/normalizePageData.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateTwoStagePage",
    notes: "Cost intent.",
  },
  tools: {
    id: "tools",
    queueKeys: ["tools"],
    routes: ["/tools/[symptom]"],
    templates: ["tools pages"],
    promptDoc: "tools prompts",
    schemaModule: "lib/content/normalizePageData.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateTwoStagePage",
    notes: "Toolkit pages.",
  },
  maintenance: {
    id: "maintenance",
    queueKeys: ["maintenance"],
    routes: ["/maintenance/[symptom]"],
    templates: ["maintenance guides"],
    promptDoc: "maintenance prompts",
    schemaModule: "lib/content/normalizePageData.ts",
    validatorModule: "lib/validators/validate-v2.ts",
    generator: "generateTwoStagePage",
    notes: "Maintenance.",
  },
} as const satisfies Record<string, PageTypeDefinition>;

export type PageTypeId = keyof typeof PAGE_TYPES;

/** Map legacy / duplicate queue labels → canonical registry id */
export const PAGE_TYPE_ALIASES: Record<string, PageTypeId> = {
  hsd: "hsd",
  symptom: "symptom",
  /** Authority / diagnostic engine labels → single HSD contract */
  diagnose: "hsd",
  diagnostic: "hsd",
  diagnostic_engine: "hsd",
  condition: "hsd",
  repair: "repair",
  emergency: "emergency",
  hybrid: "hybrid",
  cause: "cause",
  system: "system",
  hub: "hub",
  cluster: "cluster",
  authority: "authority",
  component: "component",
  location_hub: "location_hub",
  fix: "fix",
  cost: "cost",
  tools: "tools",
  maintenance: "maintenance",
  city_service: "city_service",
  "city-service": "city_service",
  /** Localized HSD rows historically used `city_symptom`; canonical authority id is `hsd`. */
  city_symptom: "hsd",
  "city-symptom": "hsd",
  /** Legacy `generation_queue` label → canonical HSD registry id */
  hvac_authority_v3: "hsd",
};

export function normalizePageTypeKey(pageType: string | undefined | null, proposedSlug: string): PageTypeId {
  const slug = (proposedSlug || "").toLowerCase();
  if (slug.startsWith("repair/")) return "repair";
  if (slug.startsWith("emergency/")) return "emergency";

  const key = (pageType ?? "").toLowerCase().trim();
  if (!key) return "hsd";

  const aliased = PAGE_TYPE_ALIASES[key];
  if (aliased) return aliased;

  if (key in PAGE_TYPES) return key as PageTypeId;

  /** Unknown queue labels default to HSD authority (no silent fallthrough to `symptom`). */
  return "hsd";
}

export function getPageTypeConfig(id: PageTypeId): PageTypeDefinition {
  return PAGE_TYPES[id];
}

export function tryGetPageTypeConfig(id: string): PageTypeDefinition | null {
  const key = (id || "").toLowerCase();
  if (key in PAGE_TYPES) return PAGE_TYPES[key as PageTypeId];
  const aliased = PAGE_TYPE_ALIASES[key];
  return aliased ? PAGE_TYPES[aliased] : null;
}
