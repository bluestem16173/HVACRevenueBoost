/**
 * CONDITION_SCHEMA_MIN — Lean authority condition page schema.
 * Replaces the fragile locked schema with a minimal required subset.
 */

export const CONDITION_SCHEMA_MIN = {
  name: "CONDITION_SCHEMA_MIN",
  schema: {
    type: "object" as const,
    additionalProperties: true,
    required: [
      "title",
      "summary",
      "fastAnswer",
      "primaryCauses",
      "diagnosticSteps",
      "repairOptions",
      "costSnapshot",
      "whenToCall",
      "related"
    ],
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      fastAnswer: { type: "string" },
      primaryCauses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            signal: { type: "string" }
          },
          required: ["name", "signal"]
        }
      },
      diagnosticSteps: {
        type: "array",
        items: { type: "string" }
      },
      repairOptions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            difficulty: { type: "string" }
          },
          required: ["name", "difficulty"]
        }
      },
      costSnapshot: {
        type: "object",
        properties: {
          diyRange: { type: "string" },
          proRange: { type: "string" },
          majorRepairRange: { type: "string" },
          costNote: { type: "string" }
        }
      },
      whenToCall: {
        type: "array",
        items: { type: "string" }
      },
      related: {
        type: "array",
        items: { type: "string" }
      }
    }
  } as Record<string, unknown>
};
