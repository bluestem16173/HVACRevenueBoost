Generate a complete diagnostic page using production v2 schema (see diagnosticSchema.ts).

INPUT:
- slug: {{SLUG}}
- page_type: symptom
- system: {{SYSTEM_SLUG_OPTIONAL}}
- extra_context: {{OPTIONAL_TECH_NOTES}}
- include_image_map: {{true_or_false}}

{{PAGE_EMPHASIS_BLOCK}}

🔥 CRITICAL RULE (LOCK THIS)
"Renderer decides layout, NOT prompt." Do NOT attempt to format the structure of the JSON values with HTML, custom Markdown styling, or layout suggestions. The frontend renderer exclusively controls the layout.

Return a fully populated JSON object. No other text.

If include_image_map is false, omit imageMap entirely.
If include_image_map is true and the consuming schema supports imageMap, include deterministic filenames only. If the schema does not support imageMap, omit imageMap.
