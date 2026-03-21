/**
 * Analyze CSV export of generated HVAC pages.
 * Input: floral-fog-17848024_production_neondb_2026-03-21_09-26-49.csv
 *
 * Usage:
 *   npx tsx scripts/analyze-pages-export.ts
 *   npx tsx scripts/analyze-pages-export.ts path/to/export.csv
 */
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const FILE_NAME = "floral-fog-17848024_production_neondb_2026-03-21_09-26-49.csv";
const PROJECT_ROOT = path.resolve(__dirname, "..");

function resolvePath(arg?: string): string {
  if (arg) {
    const p = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg);
    if (fs.existsSync(p)) return p;
  }
  const candidates = [
    path.join(PROJECT_ROOT, FILE_NAME),
    path.join(process.cwd(), FILE_NAME),
    FILE_NAME,
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return "";
}

const filePath = resolvePath(process.argv[2]);
if (!filePath) {
  console.error(`ERROR: CSV not found. Place '${FILE_NAME}' in project root, or run:`);
  console.error(`  npx tsx scripts/analyze-pages-export.ts <path-to-csv>`);
  process.exit(1);
}

console.log(`Using file: ${filePath}\n`);

// --- STEP 1: LOAD DATA ---
const raw = fs.readFileSync(filePath, "utf-8");
const records = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true });
const df = records as Record<string, string>[];

console.log("=".repeat(60));
console.log("STEP 1 — LOAD DATA");
console.log("=".repeat(60));
console.log("Total rows:", df.length);
console.log("Columns:", Object.keys(df[0] || []));

// --- STEP 2: PAGE TYPE BREAKDOWN ---
console.log("\n" + "=".repeat(60));
console.log("STEP 2 — PAGE TYPE BREAKDOWN");
console.log("=".repeat(60));
const pageTypeCol = "page_type";
if (df[0] && pageTypeCol in df[0]) {
  const counts: Record<string, number> = {};
  for (const r of df) {
    const v = r[pageTypeCol] ?? "(empty)";
    counts[v] = (counts[v] ?? 0) + 1;
  }
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`${k}: ${v}`);
  }
} else {
  console.log("(no page_type column)");
}

// --- STEP 3: BASIC DATA QUALITY ---
console.log("\n" + "=".repeat(60));
console.log("STEP 3 — BASIC DATA QUALITY");
console.log("=".repeat(60));
const contentCol =
  "content_json" in (df[0] || {})
    ? "content_json"
    : Object.keys(df[0] || {}).find((c) => /content/i.test(c)) || null;
if (contentCol) {
  const missing = df.filter((r) => r[contentCol] == null || r[contentCol] === "").length;
  console.log("Missing content_json:", missing);
} else {
  console.log("(no content column found)");
}
const slugMissing = df.filter((r) => !r.slug || r.slug.trim() === "").length;
const titleMissing = df.filter((r) => !r.title || r.title.trim() === "").length;
console.log("Missing slug:", slugMissing);
console.log("Missing title:", titleMissing);

// --- STEP 4: CONTENT DEPTH CHECK ---
console.log("\n" + "=".repeat(60));
console.log("STEP 4 — CONTENT DEPTH CHECK");
console.log("=".repeat(60));
const col = contentCol || Object.keys(df[0] || {})[0] || "content_json";
const lengths = df.map((r) => String(r[col] ?? "").length);
const sorted = [...lengths].sort((a, b) => a - b);
const min = sorted[0] ?? 0;
const max = sorted[sorted.length - 1] ?? 0;
const sum = lengths.reduce((a, b) => a + b, 0);
const mean = lengths.length ? sum / lengths.length : 0;
const mid = Math.floor(lengths.length / 2);
const median =
  lengths.length === 0
    ? 0
    : lengths.length % 2
      ? sorted[mid]!
      : (sorted[mid - 1]! + sorted[mid]!) / 2;

console.log("count:", lengths.length);
console.log("mean:", mean.toFixed(1));
console.log("std: (N/A - approx from min/max)");
console.log("min:", min);
console.log("25%:", sorted[Math.floor(lengths.length * 0.25)] ?? "N/A");
console.log("50%:", median.toFixed(1));
console.log("75%:", sorted[Math.floor(lengths.length * 0.75)] ?? "N/A");
console.log("max:", max);

// --- STEP 5: STRONG PAGES ---
console.log("\n" + "=".repeat(60));
console.log("STEP 5 — STRONG PAGES (content > 1500, symptom, has slug)");
console.log("=".repeat(60));
const strong_pages = df.filter((r) => {
  const len = String(r[col] ?? "").length;
  const slugOk = !!r.slug?.trim();
  const ptOk = !pageTypeCol || r[pageTypeCol] === "symptom";
  return len > 1500 && slugOk && ptOk;
});
console.log("Strong pages count:", strong_pages.length);

// --- STEP 6: WEAK PAGES ---
console.log("\n" + "=".repeat(60));
console.log("STEP 6 — WEAK PAGES (content < 800 OR missing content)");
console.log("=".repeat(60));
const weak_pages = df.filter((r) => {
  const len = String(r[col] ?? "").length;
  const missing = r[col] == null || r[col] === "";
  return len < 800 || missing;
});
console.log("Weak pages count:", weak_pages.length);

// --- STEP 7: SAMPLE OUTPUT ---
console.log("\n" + "=".repeat(60));
console.log("STEP 7 — SAMPLE OUTPUT");
console.log("=".repeat(60));
console.log("\nSample strong pages (slug, page_type):");
strong_pages.slice(0, 10).forEach((r) => console.log(`  ${r.slug || ""}\t${r[pageTypeCol] ?? ""}`));

console.log("\nSample weak pages (slug, page_type):");
weak_pages.slice(0, 10).forEach((r) => console.log(`  ${r.slug || ""}\t${r[pageTypeCol] ?? ""}`));

// --- STEP 8: EXPORT CLEAN DATASET ---
console.log("\n" + "=".repeat(60));
console.log("STEP 8 — EXPORT CLEAN DATASET");
console.log("=".repeat(60));
const outPath = path.join(PROJECT_ROOT, "clean_pages_for_import.csv");
const headers = Object.keys(strong_pages[0] || df[0] || {});
const csvLines = [headers.join(",")];
for (const row of strong_pages) {
  csvLines.push(
    headers.map((h) => {
      const v = String(row[h] ?? "").replace(/"/g, '""');
      return v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v}"` : v;
    }).join(",")
  );
}
fs.writeFileSync(outPath, csvLines.join("\n"), "utf-8");
console.log("Saved clean dataset:", strong_pages.length, "rows →", outPath);

// --- FINAL OUTPUT ---
console.log("\n" + "=".repeat(60));
console.log("FINAL SUMMARY");
console.log("=".repeat(60));
const total = df.length;
const pctStrong = total ? (100 * strong_pages.length) / total : 0;
const pctWeak = total ? (100 * weak_pages.length) / total : 0;

console.log(`
1. Total pages: ${total}
2. Strong pages: ${strong_pages.length} (${pctStrong.toFixed(1)}%)
   Weak pages:   ${weak_pages.length} (${pctWeak.toFixed(1)}%)

3. RECOMMENDED ACTION:
   • Import strong pages  → clean_pages_for_import.csv
   • Regenerate weak pages (content < 800 or missing)
`);
console.log("=".repeat(60));
