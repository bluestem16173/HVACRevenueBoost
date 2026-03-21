"""
Analyze CSV export of generated HVAC pages.
Input: floral-fog-17848024_production_neondb_2026-03-21_09-26-49.csv

Usage:
  py scripts/analyze-pages-export.py
  py scripts/analyze-pages-export.py path/to/export.csv
"""
import os
import sys

import pandas as pd

FILE_NAME = "floral-fog-17848024_production_neondb_2026-03-21_09-26-49.csv"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Allow path from CLI
if len(sys.argv) > 1:
    file_path = sys.argv[1]
    if not os.path.isfile(file_path):
        print(f"ERROR: File not found: {file_path}")
        sys.exit(1)
else:
    POSSIBLE_PATHS = [
        os.path.join(PROJECT_ROOT, FILE_NAME),
        os.path.join(os.getcwd(), FILE_NAME),
        FILE_NAME,
    ]
    file_path = None
    for p in POSSIBLE_PATHS:
        if os.path.isfile(p):
            file_path = p
            break
    if not file_path:
        print(f"ERROR: CSV not found. Place '{FILE_NAME}' in project root, or run:")
        print(f"  py scripts/analyze-pages-export.py <path-to-csv>")
        sys.exit(1)

print(f"Using file: {file_path}\n")

# --- STEP 1: LOAD DATA ---
df = pd.read_csv(file_path)
print("=" * 60)
print("STEP 1 — LOAD DATA")
print("=" * 60)
print("Total rows:", len(df))
print("Columns:", list(df.columns))

# --- STEP 2: PAGE TYPE BREAKDOWN ---
print("\n" + "=" * 60)
print("STEP 2 — PAGE TYPE BREAKDOWN")
print("=" * 60)
if "page_type" in df.columns:
    print(df["page_type"].value_counts())
else:
    print("(no page_type column)")

# --- STEP 3: BASIC DATA QUALITY ---
print("\n" + "=" * 60)
print("STEP 3 — BASIC DATA QUALITY")
print("=" * 60)
content_col = "content_json" if "content_json" in df.columns else (
    df.columns[df.columns.str.contains("content", case=False)].tolist()[0]
    if any(df.columns.str.contains("content", case=False)) else None
)
if content_col:
    print("Missing content_json:", df[content_col].isna().sum())
else:
    print("(no content column found)")
print("Missing slug:", df["slug"].isna().sum() if "slug" in df.columns else "N/A")
print("Missing title:", df["title"].isna().sum() if "title" in df.columns else "N/A")

# --- STEP 4: CONTENT DEPTH CHECK ---
print("\n" + "=" * 60)
print("STEP 4 — CONTENT DEPTH CHECK")
print("=" * 60)
col = content_col
if not col:
    print("WARNING: No content column found. Using first column for length.")
    col = df.columns[0]
df["content_length"] = df[col].astype(str).apply(len)
print(df["content_length"].describe())

# --- STEP 5: STRONG PAGES ---
print("\n" + "=" * 60)
print("STEP 5 — STRONG PAGES (content > 1500, symptom, has slug)")
print("=" * 60)
slug_ok = df["slug"].notna() if "slug" in df.columns else pd.Series([True] * len(df))
pt_ok = df["page_type"] == "symptom" if "page_type" in df.columns else pd.Series([True] * len(df))
strong_pages = df[(df["content_length"] > 1500) & slug_ok & pt_ok]
print("Strong pages count:", len(strong_pages))

# --- STEP 6: WEAK PAGES ---
print("\n" + "=" * 60)
print("STEP 6 — WEAK PAGES (content < 800 OR missing content)")
print("=" * 60)
content_na = df[col].isna() if col else pd.Series([False] * len(df))
weak_pages = df[(df["content_length"] < 800) | content_na]
print("Weak pages count:", len(weak_pages))

# --- STEP 7: SAMPLE OUTPUT ---
print("\n" + "=" * 60)
print("STEP 7 — SAMPLE OUTPUT")
print("=" * 60)
print("\nSample strong pages (slug, page_type):")
slug_col = "slug" if "slug" in df.columns else df.columns[0]
pt_col = "page_type" if "page_type" in df.columns else None
cols = [c for c in [slug_col, pt_col] if c]
if cols and len(strong_pages) > 0:
    print(strong_pages[cols].head(10))
else:
    print("(none)")

print("\nSample weak pages (slug, page_type):")
if cols and len(weak_pages) > 0:
    print(weak_pages[cols].head(10))
else:
    print("(none)")

# --- STEP 8: EXPORT CLEAN DATASET ---
print("\n" + "=" * 60)
print("STEP 8 — EXPORT CLEAN DATASET")
print("=" * 60)
clean_df = strong_pages.copy()
out_path = os.path.join(PROJECT_ROOT, "clean_pages_for_import.csv")
clean_df.to_csv(out_path, index=False)
print("Saved clean dataset:", len(clean_df), "rows →", out_path)

# --- FINAL OUTPUT ---
print("\n" + "=" * 60)
print("FINAL SUMMARY")
print("=" * 60)
total = len(df)
pct_strong = 100 * len(strong_pages) / total if total else 0
pct_weak = 100 * len(weak_pages) / total if total else 0

print(f"""
1. Total pages: {total}
2. Strong pages: {len(strong_pages)} ({pct_strong:.1f}%)
   Weak pages:   {len(weak_pages)} ({pct_weak:.1f}%)

3. RECOMMENDED ACTION:
   • Import strong pages  → clean_pages_for_import.csv
   • Regenerate weak pages (content < 800 or missing)
""")
print("=" * 60)
