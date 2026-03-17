# 🚀 MASTER PROMPT — JSON FIX + RECOVERY + HARDENING

Drop this into Cursor to fix JSON parsing failures in AI content generation.

---

## 🚨 CURRENT ERROR

"Unterminated string in JSON"

**Cause:** AI output is truncated due to token limits, resulting in invalid JSON.

---

## 🎯 OBJECTIVE

Make the system:

- Never crash on JSON.parse
- Recover from partial AI output
- Retry intelligently when needed
- Validate structure before use

---

## ✅ IMPLEMENTED FIXES

### 1. `safeJsonParse` in `lib/utils.ts`

- Tries `JSON.parse` first
- On failure: truncates at last `}` (common for truncated output)
- Attempts to close unterminated strings + balance braces/brackets
- Returns `null` if unrecoverable

### 2. All AI generation uses `safeJsonParse`

- `lib/canary-generator.ts`
- `lib/ai-generator.ts`
- `lib/ai-graph-generator.ts`

### 3. Retry logic

- `callWithRetry` wraps generation; when `safeJsonParse` returns null, throws → retries API call

### 4. Token pressure reduced (MASTER-PROMPT-CANARY)

- causes: MAX 4
- repairs: MAX 4
- faq: MAX 2
- max_tokens: 1600 (was 1200)

### 5. Prompt instruction

- "Ensure all JSON is fully closed. Do not leave trailing objects, arrays, or strings unclosed."

### 6. Debug

- Set `DEBUG_CANARY=true` to log raw AI output (last 500 chars) on parse failure

---

## 🔧 USAGE

```ts
import { safeJsonParse } from "@/lib/utils";

const data = safeJsonParse<MyType>(aiOutput);
if (!data) {
  throw new Error("AI returned unrecoverable JSON");
}
```

---

## ✅ SUCCESS CRITERIA

- No JSON.parse crashes
- Truncated outputs recovered or retried
- Pages generate successfully
- Canary completes without failure
