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
      headline: z.string().min(50),
      top_causes: z
        .array(
          z.object({
            label: z.string(),
            probability: z.string(),
            /** DG-style authority paragraph (mechanism, load, failure chain). */
            deep_dive: z.string().default(""),
          })
        )
        .min(3),
      core_truth: z.string().min(70),
      risk_warning: z.string().min(45),
      /**
       * DG scan lines under headline (each string one line; use → for branches).
       * When 3+ non-empty lines, summary uses compact layout and shows this instead of a long core_truth block.
       */
      flow_lines: z.array(z.string()).default([]),
    }),

    /** Expert-voice bridge after the 30s summary: diagnosis → mechanism → wear/failure (plain text). */
    what_this_means: z.string().default(""),

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

    /** Scannable symptom → mechanism → action; rendered as a real HTML table in `renderHsdV25`. */
    quick_table: z
      .array(
        z.object({
          symptom: z.string(),
          cause: z.string(),
          fix: z.string(),
        })
      )
      .min(4),

    /** Branch lines using → or -> (Mermaid optional later). */
    decision_tree_text: z.array(z.string()).default([]),

    /** 1–2 lines the model must echo in summary, steps, and final_warning (intentional repetition). */
    canonical_truths: z.array(z.string()).max(2).default([]),

    /** Pro tools — reinforces real technical scope; not all fixes are DIY. */
    tools: z.array(z.string()).default([]),

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

    /** Decisive line rendered above the repair matrix table (DIY band vs sealed-system / major). */
    repair_matrix_intro: z.string().default(""),

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
      .min(4),

    decision: z.object({
      safe: z.array(z.string()).min(2),
      call_pro: z.array(z.string()).min(2),
      stop_now: z.array(z.string()).min(2),
    }),

    /** Single authority line after the three decision columns (continued operation / cost). */
    decision_footer: z.string().default(""),

    final_warning: z.string().min(60),
    cta: z.string().min(45),
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
