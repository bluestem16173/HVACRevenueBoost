import { z } from "zod";

export const HSDV25Schema = z
  .object({
    page_type: z.literal("city_symptom"),
    schema_version: z.literal("hsd_v2"),

    title: z.string().min(10),
    /** Storage slug: `{vertical}/{symptom-kebab}/{city-kebab}` (e.g. `hvac/weak-airflow/tampa-fl`, `hvac/ac-not-cooling/fort-myers-fl`). */
    slug: z
      .string()
      .regex(/^(hvac|plumbing|electrical)\/[a-z0-9-]+\/[a-z0-9-]+$/i),

    summary_30s: z.object({
      headline: z.string().min(40),
      top_causes: z
        .array(
          z.object({
            label: z.string(),
            probability: z.string(),
          })
        )
        .min(3),
      core_truth: z.string().min(20),
      risk_warning: z.string().min(30),
    }),

    quick_checks: z
      .array(
        z.object({
          check: z.string(),
          homeowner: z.string(),
          result_meaning: z.string(),
          next_step: z.string(),
          risk: z.string(),
        })
      )
      .min(3),

    diagnostic_steps: z
      .array(
        z.object({
          step: z.string(),
          homeowner: z.string(),
          pro: z.string(),
          risk: z.string(),
        })
      )
      .min(3),

    diagnostic_flow: z.object({
      nodes: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
          })
        )
        .min(4),
      edges: z
        .array(
          z.object({
            from: z.string(),
            to: z.string(),
            label: z.string().optional(),
          })
        )
        .min(3),
    }),

    repair_matrix: z
      .array(
        z.object({
          issue: z.string(),
          fix: z.string(),
          cost_min: z.coerce.number(),
          cost_max: z.coerce.number(),
          difficulty: z.preprocess(
            (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
            z.enum(["easy", "moderate", "pro"])
          ),
        })
      )
      .min(4),

    cost_escalation: z
      .array(
        z.object({
          stage: z.string(),
          description: z.string(),
          cost: z.string(),
        })
      )
      .min(3),

    decision: z.object({
      safe: z.array(z.string()).min(2),
      call_pro: z.array(z.string()).min(2),
      stop_now: z.array(z.string()).min(2),
    }),

    final_warning: z.string().min(20),
    cta: z.string().min(20),
  })
  .superRefine((data, ctx) => {
    const ids = new Set(data.diagnostic_flow.nodes.map((n) => n.id.trim()).filter(Boolean));
    for (let i = 0; i < data.diagnostic_flow.edges.length; i++) {
      const e = data.diagnostic_flow.edges[i];
      const from = e.from.trim();
      const to = e.to.trim();
      if (!ids.has(from)) {
        ctx.addIssue({
          code: "custom",
          message: `diagnostic_flow.edges[${i}].from "${from}" is not a node id`,
          path: ["diagnostic_flow", "edges", i, "from"],
        });
      }
      if (!ids.has(to)) {
        ctx.addIssue({
          code: "custom",
          message: `diagnostic_flow.edges[${i}].to "${to}" is not a node id`,
          path: ["diagnostic_flow", "edges", i, "to"],
        });
      }
    }
  });

export type HsdV25Payload = z.infer<typeof HSDV25Schema>;
