# 🚀 MASTER PROMPT — SYSTEM FIX + HARDENING (DROP INTO CURSOR)

You are a senior TypeScript architect and data pipeline engineer.

Your task is to **HARDEN and FIX** a Next.js + Node.js AI content generation system that is currently failing due to inconsistent data shapes and weak schema enforcement.

The system generates HVAC diagnostic pages using AI and builds a graph-based knowledge engine.

---

## 🚨 CURRENT FAILURES (MUST FIX)

### 1. Runtime error: `TypeError: x.toLowerCase is not a function`

**CAUSE:**  
The system previously used string arrays: `["Bad capacitor"]`  
Now uses object arrays: `[{ name: "Bad capacitor", indicator: "..." }]`  
But string methods are still being applied directly.

### 2. JSON schema drift

AI sometimes returns:
- strings instead of objects
- missing fields
- truncated JSON

### 3. Rendering instability

Frontend expects consistent structure but receives mixed formats.

---

## 🎯 OBJECTIVE

Make the system:

- ✅ Schema-safe
- ✅ Backward compatible (string + object)
- ✅ Crash-proof
- ✅ Strictly validated at generation level

---

## 🔧 TASKS (EXECUTE ALL)

### 1. CREATE UNIVERSAL NORMALIZER

Add this helper in a shared utils file:

```ts
export function normalizeToString(input: any): string {
  if (!input) return "";

  if (typeof input === "string") return input;

  if (typeof input === "object") {
    return input.name || input.label || input.title || "";
  }

  return String(input);
}
```

### 2. PATCH ALL STRING OPERATIONS

Find **ALL** occurrences of:

- `.toLowerCase()`
- `.replace()`
- `.includes()`
- `.trim()`

And wrap them:

**BEFORE:** `x.toLowerCase()`  
**AFTER:** `normalizeToString(x).toLowerCase()`

### 3. PATCH ARRAY MAPPERS

**BEFORE:** `array.map(x => x.toLowerCase())`  
**AFTER:** `array.map(x => normalizeToString(x).toLowerCase())`

### 4. HARDEN GRAPH GENERATION

In:

- `graph-generation-worker.ts`
- `graph-link-builder.ts`

Ensure ALL nodes use:

```ts
const name = normalizeToString(node);
```

**NEVER** assume string.

### 5. ENFORCE STRICT AI SCHEMA

In generation code:

**REPLACE:**
```ts
response_format: {
  type: "json_schema",
  json_schema: { name: "canary_page" }
}
```

**WITH:**
```ts
response_format: {
  type: "json_schema",
  json_schema: {
    name: "canary_page",
    strict: true,
    schema: CANARY_SCHEMA_OBJECT
  }
}
```

### 6. CREATE MINIMAL STRICT SCHEMA

Ensure required fields:

- `slug`
- `title`
- `fast_answer`
- `causes` (array of objects)
- `repairs` (array of objects)

Each object **MUST** contain: `name` (string)

### 7. ADD VALIDATION LAYER

After AI response:

```ts
if (!isValidSchema(output)) {
  retryGeneration({
    temperature: 0.2,
    max_tokens: 1200
  });
}
```

### 8. PREVENT TOKEN TRUNCATION

Limit:

- `causes` ≤ 5
- `repairs` ≤ 5
- `diagnostic_steps` ≤ 5
- `faq` ≤ 3

### 9. BACKWARD COMPATIBILITY

System **MUST** support:

**OLD:** `"Bad capacitor"`  
**NEW:** `{ name: "Bad capacitor" }`

**WITHOUT** crashing.

### 10. FAIL-SAFE RENDERING

In `contentToHtml.ts` (or equivalent):

Guard **ALL** fields:

```ts
const safe = normalizeToString(value);
```

---

## ✅ SUCCESS CRITERIA

After refactor:

- [ ] No runtime errors
- [ ] No `.toLowerCase` crashes
- [ ] All pages render
- [ ] Graph builds successfully
- [ ] JSON always valid
- [ ] System handles mixed legacy + new data

---

## ⚠️ DO NOT

- Remove legacy support
- Assume consistent data
- Trust AI output blindly

---

## 🎯 FINAL OUTPUT

Return:

1. Updated helper functions
2. Refactored critical files
3. Example patched code blocks
4. Any missing safeguards

Make all fixes **production-ready** and **minimal**.

---

## 🧠 Why this is the right move (for YOU specifically)

Given your setup:

- multiple workers ⚙️
- graph engine 🧠
- programmatic SEO at scale 📈

This prompt ensures:

- ✅ You don't babysit errors
- ✅ You don't break when scaling to 1,000+ pages
- ✅ You can run HVAC + DecisionGrid simultaneously
