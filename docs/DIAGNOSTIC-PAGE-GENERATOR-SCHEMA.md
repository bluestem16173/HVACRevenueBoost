# Diagnostic Page Generator — UI-Layout Aligned

The AI diagnostic content generator produces structured JSON that matches the symptom page template 1:1. Every generated page strictly follows the DecisionGrid / HVAC Diagnostic UI layout.

## Output Schema

The generator returns structured JSON with these sections (in order):

| Section | Key | Description |
|---------|-----|-------------|
| 1. Page Header Context | `header_context` | system, subsystem, problem, most_common_cause |
| 2. Fast Diagnostic Intro | `intro` | 2–3 sentence summary |
| 3. Most Common Cause Callout | `most_common_cause` | cause, short_explanation, first_diagnostic_step |
| 4. In This Guide (TOC) | `toc` | Anchor list for sections |
| 5. Diagnostic Flowchart | `diagnostic_flow` | Array of cause names → rendered as Mermaid |
| 6. Causes at a Glance | `causes_table` | problem \| likely_cause \| fix_link (min 5 rows) |
| 7. Troubleshoot / DIY | `troubleshoot_intro` | Short explanation |
| 8. Interactive Diagnostic Tree | `diagnostic_tree` | Decision-tree nodes |
| 9. Common Causes & Fixes | `causes` | Min 5: cause_name, why_it_happens, symptoms, repair_steps, difficulty_level |
| 10. Related Problems | `related_problems` | Related symptom page names |
| 11. Typical Repair Costs | `repair_costs` | repair \| diy_cost \| professional_cost |
| 12. Quick Repair Toolkit | `toolkit` | Tool list |
| 13. Common Mistakes | `common_mistakes` | What NOT to do |
| 14. Prevention Tips | `prevention` | Maintenance recommendations |
| 15. When to Call Technician | `when_to_call_technician` | Dangerous repairs |
| 16. Continue Troubleshooting | `continue_troubleshooting` | Deeper diagnostic guides |
| 17. FAQ | `faq` | Min 4: question + answer |

## Content Quality Rules

- Minimum 5 causes, 5 repairs, 4 FAQ
- Diagnostic tree required
- Repair cost table required
- Use concise technician-style wording

## Token Settings

`max_tokens: 2000` for full authority pages.

## Template Integration

When `contentJson.header_context` exists, the symptom template uses structured content for:

- `intro` — immediate action line
- `most_common_cause` — callout box
- `common_mistakes` — Common Mistakes section
- `prevention` — Prevention Tips section
- `faq` — FAQ section

Other sections (flowchart, causes, costs, etc.) continue to use graph data; structured content can be extended to override more sections as needed.

## Engine Version

Structured pages use `engine_version: "5.0.0-HVACRevenueBoost-UIAligned"`.
