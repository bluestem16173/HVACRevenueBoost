/**
 * Builds docs/DIAGNOSE_PAGE_BUILD_REFERENCE.md for pasting into ChatGPT Pro.
 * Run: node scripts/build-diagnose-docs-md.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "docs", "DIAGNOSE_PAGE_BUILD_REFERENCE.md");

const sections = [
  { title: "lib/content-engine/schema.ts", file: "lib/content-engine/schema.ts", lang: "typescript" },
  { title: "lib/validators/validate-v2.ts", file: "lib/validators/validate-v2.ts", lang: "typescript" },
  { title: "lib/validators/page-validator.ts", file: "lib/validators/page-validator.ts", lang: "typescript" },
  { title: "lib/normalize-content.ts", file: "lib/normalize-content.ts", lang: "typescript" },
  { title: "lib/infer-diagnostic-schema.ts", file: "lib/infer-diagnostic-schema.ts", lang: "typescript" },
  { title: "lib/page-status.ts", file: "lib/page-status.ts", lang: "typescript" },
  { title: "lib/content-engine/core.ts", file: "lib/content-engine/core.ts", lang: "typescript" },
  { title: "lib/diagnostic-engine.ts", file: "lib/diagnostic-engine.ts", lang: "typescript" },
  { title: "scripts/generation-worker.ts", file: "scripts/generation-worker.ts", lang: "typescript" },
  { title: "lib/content-engine/relational-upsert.ts", file: "lib/content-engine/relational-upsert.ts", lang: "typescript" },
  { title: "lib/content-engine/generator.ts", file: "lib/content-engine/generator.ts", lang: "typescript" },
  { title: "app/diagnose/[symptom]/page.tsx", file: "app/diagnose/[symptom]/page.tsx", lang: "tsx" },
  { title: "app/diagnose/[symptom]/error.tsx", file: "app/diagnose/[symptom]/error.tsx", lang: "tsx" },
  { title: "app/diagnose/[symptom]/loading.tsx", file: "app/diagnose/[symptom]/loading.tsx", lang: "tsx" },
  { title: "lib/normalize-diagnostic-display.ts", file: "lib/normalize-diagnostic-display.ts", lang: "typescript" },
  { title: "components/diagnostic/DiagnosticGoldPage.tsx", file: "components/diagnostic/DiagnosticGoldPage.tsx", lang: "tsx" },
  { title: "components/gold/GoldStandardPage.tsx", file: "components/gold/GoldStandardPage.tsx", lang: "tsx" },
  { title: "components/MermaidRenderer.tsx", file: "components/MermaidRenderer.tsx", lang: "tsx" },
];

const header = `# HVAC Diagnose Page — Full build reference

**Generated:** ${new Date().toISOString()}

**Purpose:** Single markdown you can paste into **ChatGPT Pro** (or similar) for architecture review, debugging, or extending the pipeline.

**How to regenerate:** \`node scripts/build-diagnose-docs-md.mjs\`

---

## Table of contents

1. [Pipeline overview](#pipeline-overview)
2. [Source files (full)](#source-files-full)

---

## Pipeline overview

**Worker path**

- \`generation_queue\` → \`generateDiagnosticEngineJson()\` → \`validateV2()\` → \`migrateOnePage()\` → \`pages\` row (\`schema_version: v5_master\`, \`content_json\`).

**Render path**

- \`/diagnose/[symptom]\` → \`getDiagnosticPageFromDB()\` (status filter: production = published/validated/review; dev or \`DIAGNOSE_ALLOW_DRAFT_GENERATED=1\` includes draft/generated) → parse \`content_json\` → \`inferDiagnosticSchemaVersion()\` when \`schema_version\` is null → \`normalizeDiagnosticToDisplayModel()\` (merges legacy hub shapes: \`hero\`, \`commonCauses\`, \`mermaidGraph\`) → \`DiagnosticGoldPage\` (v5/v6) or \`GoldStandardPage\` (v2).
- **There is no \`DiagnoseHubTemplate\`** in this repo; that name is obsolete. Amber debug JSON at the bottom only appears in development or when \`NEXT_PUBLIC_DIAGNOSE_DEBUG=1\`.

**If the main column looks empty but a debug strip appears**

- Usually **unknown/missing schema** (fixed by inference) or **legacy JSON keys** not mapped into v5 (fixed by \`mergeLegacyHubContent\` in \`normalize-diagnostic-display.ts\`), not a separate “template short-circuit.”

---

## Source files (full)

The following sections contain the **complete** current file contents from this repository.

`;

function fence(lang, body) {
  return "```" + lang + "\n" + body + "\n```\n";
}

let md = header;

for (const { title, file, lang } of sections) {
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) {
    md += `\n### MISSING: ${title}\n\n(File not found: ${file})\n\n`;
    continue;
  }
  const body = fs.readFileSync(abs, "utf8");
  md += `\n### \`${file}\`\n\n`;
  md += fence(lang, body);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md, "utf8");
console.log("Wrote:", outPath);
console.log("Bytes:", fs.statSync(outPath).size);
