# MASTER PROMPT: Authority Hub System + Snowball Expansion Engine

**DecisionGrid + HVAC Revenue Boost**

Give this prompt to Gemini/Cursor to implement the Authority Hub System + Snowball Expansion Engine.

---

You are working in a Next.js + PostgreSQL architecture powering two systems:

- **DecisionGrid** (diagnostic knowledge graph)
- **HVAC Revenue Boost** (HVAC lead generation)

The platform generates pages programmatically from a knowledge graph of:

- systems, symptoms, conditions, causes, repairs, components, cities, environments, vehicle_models

The goal is to implement a scalable authority hub architecture that organizes pages into clusters and supports a snowball expansion engine.

## OBJECTIVE

Implement the following systems:

### 1️⃣ Authority Hub System

Pages are grouped into topic hubs.

**Example:** RV HVAC hub links to: RV AC Not Cooling, RV Furnace Not Working, RV AC Freezing Up, RV AC Short Cycling

Each hub strengthens topical authority.

### 2️⃣ Snowball Expansion Engine

Automatically generate pages using patterns.

**Example expansion:**
- AC Not Cooling → AC Not Cooling While Driving
- AC Not Cooling → AC Not Cooling In Hot Weather
- AC Not Cooling → AC Not Cooling Tampa FL
- AC Not Cooling → AC Not Cooling While Driving Tampa FL

### 3️⃣ Automated Internal Linking

The system automatically links:

- hub → symptoms
- symptoms → causes
- causes → repairs
- repairs → parts
- symptoms → related symptoms

---

## PART 1: AUTHORITY HUB TABLES

### hubs

```sql
CREATE TABLE IF NOT EXISTS hubs (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    hub_type TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Examples: RV HVAC, Residential HVAC, RV Electrical, Residential Electrical, Marine HVAC, Generators, Battery Systems

### hub_nodes

Connect hubs to graph entities.

```sql
CREATE TABLE IF NOT EXISTS hub_nodes (
    id BIGSERIAL PRIMARY KEY,
    hub_id BIGINT,
    node_type TEXT,
    node_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Example: hub: RV HVAC, node_type: symptom, node: RV AC Not Cooling

### hub_links

Precomputed internal linking.

```sql
CREATE TABLE IF NOT EXISTS hub_links (
    id BIGSERIAL PRIMARY KEY,
    hub_id BIGINT,
    source_page_id BIGINT,
    target_page_id BIGINT,
    anchor_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## PART 2: PAGE PATTERN SYSTEM

### page_patterns

Patterns control page expansion. **Note:** `page_patterns` may already exist in 001_master_platform_schema; align or extend.

```sql
CREATE TABLE IF NOT EXISTS page_patterns (
    id BIGSERIAL PRIMARY KEY,
    base_entity_type TEXT,
    pattern_name TEXT,
    slug_template TEXT,
    title_template TEXT,
    description_template TEXT,
    priority INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Examples:
- pattern_name: symptom_environment
- slug_template: `{symptom}-{environment}`
- title_template: `{symptom} {environment}: Causes and Fixes`

---

## PART 3: SNOWBALL EXPANSIONS

### snowball_expansions

**Note:** May already exist in 001_master_platform_schema; align schema.

```sql
CREATE TABLE IF NOT EXISTS snowball_expansions (
    id BIGSERIAL PRIMARY KEY,
    base_entity_id BIGINT,
    base_entity_type TEXT,
    pattern_id BIGINT,
    expansion_slug TEXT UNIQUE,
    expansion_title TEXT,
    expansion_type TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Example: base_entity: AC Not Cooling, pattern: environment, expansion_slug: ac-not-cooling-while-driving

---

## PART 4: EXPANSION QUEUE

### expansion_queue

**Note:** May already exist; align schema.

```sql
CREATE TABLE IF NOT EXISTS expansion_queue (
    id BIGSERIAL PRIMARY KEY,
    base_entity_id BIGINT,
    base_entity_type TEXT,
    pattern_id BIGINT,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## PART 5: EXPANSION WORKER

Create worker: `scripts/expansion-worker.ts`

**Worker flow:**
1. Select base entities
2. Find matching page_patterns
3. Generate slug
4. Insert into snowball_expansions
5. Push into generation_queue

**Pseudo:**
```ts
for (const symptom of symptoms) {
  for (const env of environments) {
    const slug = `${symptom.slug}-${env.slug}`;
    await queuePageGeneration(slug);
  }
}
```

---

## PART 6: CRAWL SAFETY

Only expand pages if base page is indexed.

- Add column: `ALTER TABLE pages ADD COLUMN IF NOT EXISTS index_status TEXT;`
- Expansion rule: **expand only if index_status = 'indexed'**

---

## PART 7: HUB LINK BUILDER

Create script: `scripts/hub-link-builder.ts`

**Purpose:** Automatically link cluster pages.

Example: RV HVAC hub → RV AC Not Cooling, RV Furnace Not Working, RV AC Freezing Up

---

## PART 8: INTERNAL LINK GRAPH

Insert relationships into: `internal_links`, `related_nodes`, `link_graph`

Relationships:
- hub → symptoms
- symptoms → causes
- causes → repairs
- repairs → parts
- symptoms → related symptoms

---

## PART 9: INITIAL PAGE PATTERNS

Seed patterns:

| Pattern | Slug Template | Example |
|---------|---------------|---------|
| symptom + environment | `{symptom}-{environment}` | ac-not-cooling-while-driving |
| symptom + city | `{symptom}-{city}` | ac-not-cooling-tampa-fl |
| symptom + environment + city | `{symptom}-{environment}-{city}` | ac-not-cooling-while-driving-tampa-fl |
| repair + city | `{repair}-{city}` | replace-capacitor-tampa-fl |
| service + city | `{service}-{city}` | ac-repair-tampa-fl |

---

## PART 10: SCALE EXPECTATION

After implementation:

- Seed: 40 symptoms × 10 environments × 200 cities = **80,000 pages**
- Plus repairs, causes, services: **100k – 150k pages**

---

## PART 11: VALIDATION

Confirm:
- ✓ page_patterns populated
- ✓ snowball_expansions populated
- ✓ expansion_queue working
- ✓ expansion-worker running
- ✓ pages inserted into generation_queue

---

## RESULT

The platform will support:
- Authority hubs
- Programmatic expansion
- Automatic internal linking
- Diagnostic page generation
- City lead pages
- Affiliate repair pages

And scale to **100k+ pages** safely.
