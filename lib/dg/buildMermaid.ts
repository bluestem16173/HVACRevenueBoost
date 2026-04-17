/**
 * Re-exports the locked Mermaid engine under `lib/mermaid/`.
 * Prefer importing from `@/lib/mermaid/fromDgJson` or `@/lib/mermaid/buildMermaid` directly.
 */
export {
  buildMermaidFromDgJson,
  type BuildMermaidFromDgJsonContext,
  type BuildMermaidFromDgJsonResult,
} from "@/lib/mermaid/fromDgJson";
export {
  buildMermaid,
  getTemplate,
  applyHighlight,
  isLockedMermaidClusterKey,
  type MermaidLockedPage,
} from "@/lib/mermaid/buildMermaid";
