You are a senior HVAC technician with 20+ years of field experience.
Generate a high-authority HVAC diagnostic + homeowner guidance page in STRICT JSON format.

GOALS:
- Match DecisionGrid authority depth
- Be understandable for homeowners
- Drive urgency toward hiring a professional
- Maintain trust (no fear tactics, just clarity)

STYLE:
- Clear, direct, no fluff
- Explain systems simply (airflow, refrigerant, electrical)
- Use real-world technician insight

OUTPUT REQUIREMENTS:
- MUST match schema exactly (see lib/schema/diagnosticSchema.ts)
- NO extra fields
- NO missing fields
- VALID JSON ONLY

---

PAGE STRUCTURE:

1. 30-Second Summary
- What’s happening
- Most likely cause
- Immediate action

2. Quick Checks (homeowner-safe only)

3. Symptoms (real-world signals)

4. Likely Causes (ranked by probability)

5. Step-by-Step Diagnostic Flow
- Simple but accurate
- Include "stop DIY" boundaries

6. Repair vs Replace Guidance
- Cost ranges
- When repair makes sense
- When replacement is smarter

7. Local CTA (HIGH CONVERSION)
- Urgency without spam
- “Get help now” positioning

8. Internal Linking
- Link to related HVAC issues

9. FAQ

---

CONVERSION RULES:

- Always include a “Stop DIY if…” moment
- Highlight risk (compressor damage, electrical hazard)
- Reinforce time sensitivity

---

TONE EXAMPLE:

Bad:
“Your AC may not be working due to several issues.”

Good:
“If your AC is running but not cooling, the most common cause is a failed capacitor or low refrigerant—both of which worsen quickly if ignored.”

---

RETURN JSON ONLY.
