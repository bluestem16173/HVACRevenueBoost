export const DiagnosticPageSchema = {
  type: "object",
  required: [
    "title",
    "symptom",
    "system",
    "fast_answer",
    "failure_modes",
    "diagnostic_order",
    "guided_diagnosis",
    "mermaid_diagram",
    "causes",
    "repairs"
  ],
  properties: {
    title: { type: "string" },
    symptom: { type: "string" },
    system: { type: "string" },

    fast_answer: {
      type: "object",
      description:
        "Technician-density summary only — no consumer fluff. Must name a physical failure mechanism.",
      required: ["technical_summary", "primary_mechanism"],
      properties: {
        technical_summary: {
          type: "string",
          description:
            "2–4 sentences: airflow dynamics, thermodynamics, and/or electrical behavior; include measurable language where possible.",
        },
        primary_mechanism: {
          type: "string",
          description:
            "Single dominant failure mechanism (e.g. reduced mass flow → coil behavior → capacity loss).",
        },
      },
    },

    failure_modes: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        required: ["name", "description"],
        properties: {
          name: { type: "string" },
          description: { type: "string" }
        }
      }
    },

    diagnostic_order: {
      type: "array",
      minItems: 4,
      items: { type: "string" }
    },

    guided_diagnosis: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        required: ["scenario", "likely_modes", "next_step"],
        properties: {
          scenario: { type: "string" },
          likely_modes: {
            type: "array",
            items: { type: "string" }
          },
          next_step: { type: "string" }
        }
      }
    },

    mermaid_diagram: {
      type: "string",
      description: "Must be valid Mermaid flowchart TD"
    },

    causes: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        required: [
          "name",
          "failure_mode",
          "mechanism",
          "description",
          "symptoms",
          "diagnostic_signal",
          "confidence",
          "test",
          "expected_result",
        ],
        properties: {
          name: { type: "string" },
          failure_mode: { type: "string" },
          mechanism: {
            type: "string",
            description:
              "Physical chain: what fails, how it propagates (not a generic label).",
          },
          description: { type: "string" },
          symptoms: {
            type: "array",
            minItems: 1,
            items: { type: "string" },
          },
          diagnostic_signal: {
            type: "string",
            description:
              "Observable or measurable signal (temps, pressures, electrical, airflow).",
          },
          confidence: { type: "number" },
          test: { type: "string" },
          expected_result: { type: "string" },
        },
      },
    },

    repairs: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        required: [
          "name",
          "cause",
          "system_effect",
          "difficulty",
          "estimated_cost",
          "description",
        ],
        properties: {
          name: { type: "string" },
          cause: { type: "string" },
          system_effect: {
            type: "string",
            description:
              "What system behavior this repair restores (compression, airflow, heat transfer, control sequence).",
          },
          difficulty: {
            type: "string",
            enum: ["easy", "moderate", "hard"],
          },
          estimated_cost: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          description: { type: "string" },
        },
      },
    },

    /** v6 / display-bridge: optional on v5; required when schema_version is v6_dg_hvac_hybrid */
    quick_toolkit: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        required: ["tool", "purpose", "difficulty"],
        properties: {
          tool: { type: "string" },
          purpose: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "moderate", "hard"] },
        },
      },
    },
    tools_needed: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        required: ["name", "purpose", "difficulty"],
        properties: {
          name: { type: "string" },
          purpose: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "moderate", "hard"] },
        },
      },
    },
    problem_overview: {
      type: "string",
      description:
        "Short technician-facing overview of the dominant failure states for this symptom.",
    },
    system_explainer: {
      type: "string",
      description:
        "How the relevant HVAC subsystem works under normal conditions (thermodynamic, airflow, or electrical language).",
    },
    bench_procedures: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        required: ["title", "steps", "field_insight"],
        properties: {
          title: { type: "string" },
          steps: {
            type: "array",
            minItems: 2,
            items: { type: "string" },
          },
          field_insight: { type: "string" },
        },
      },
    },
    prevention_tips: {
      type: "array",
      minItems: 3,
      items: { type: "string" },
    },
    related_guides: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        required: ["title", "slug", "type"],
        properties: {
          title: { type: "string" },
          slug: { type: "string" },
          type: { type: "string" },
        },
      },
    },
    faq: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        required: ["question", "answer"],
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
      },
    },

    /** HVAC Revenue Boost — lead / SEO (optional; include when not using DecisionGrid diagnostic mode) */
    meta_title: { type: "string" },
    meta_description: { type: "string" },
    sections: {
      type: "array",
      description: "Conversion-first section bodies; short paragraphs.",
      items: {
        type: "object",
        required: ["id", "heading", "body"],
        properties: {
          id: { type: "string" },
          heading: { type: "string" },
          body: { type: "string" },
        },
      },
    },
    cta_blocks: {
      type: "array",
      description: "Exactly 3: above_fold, mid_page, bottom",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        required: ["placement", "headline", "subtext", "button_text", "phone_prompt"],
        properties: {
          placement: { type: "string", enum: ["above_fold", "mid_page", "bottom"] },
          headline: { type: "string" },
          subtext: { type: "string" },
          button_text: { type: "string" },
          phone_prompt: { type: "string" },
        },
      },
    },
  }
};

export const HVACAuthorityPageJsonSchema = {
  type: "object",
  required: [
    "layout", "page_type", "schema_version", "slug", "title", "h1",
    "meta_title", "meta_description", "canonical_path", "intro",
    "summary_30s", "immediate_quick_checks", "diy_tools", "high_risk_warning",
    "emergency_cta", "most_common_causes", "how_the_system_works",
    "advanced_diagnostic_flow", "mermaid_diagram", "repair_matrix",
    "repair_vs_replace", "when_to_stop_diy", "prevention_tips",
    "faqs", "internal_links", "bottom_cta", "author_note"
  ],
  properties: {
    layout: { type: "string", enum: ["hvac_authority_v3"] },
    page_type: { type: "string", enum: ["diagnostic"] },
    schema_version: { type: "string", enum: ["v3"] },
    slug: { type: "string" },
    title: { type: "string" },
    h1: { type: "string" },
    meta_title: { type: "string" },
    meta_description: { type: "string" },
    canonical_path: { type: "string" },
    intro: { type: "string" },
    summary_30s: {
      type: "object",
      properties: { label: { type: "string" }, overview: { type: "string" }, bullets: { type: "array", items: { type: "string" } } }
    },
    immediate_quick_checks: {
      type: "array",
      items: { type: "object", properties: { step_number: { type: "number" }, instruction: { type: "string" }, why_it_matters: { type: "string" } } }
    },
    diy_tools: {
       type: "array",
       items: { type: "object", properties: { tool: { type: "string" }, purpose: { type: "string" }, safe_for_basic_diy: { type: "boolean" }, caution_note: { type: "string" } } }
    },
    high_risk_warning: {
       type: "object",
       properties: { severity: { type: "string", enum: ["medium", "high", "critical"] }, title: { type: "string" }, body: { type: "string" }, risk_points: { type: "array", items: { type: "string" } }, show_emergency_cta: { type: "boolean" } }
    },
    emergency_cta: {
       type: "object",
       properties: { title: { type: "string" }, body: { type: "string" }, button_text: { type: "string" }, urgency_note: { type: "string" } }
    },
    most_common_causes: {
       type: "array",
       description: "EXACTLY 4 ITEMS REQUIRED",
       items: { type: "object", properties: { cause: { type: "string" }, probability_note: { type: "string" }, explanation: { type: "string" }, signs: { type: "array", items: { type: "string" } } } }
    },
    how_the_system_works: {
       type: "object",
       properties: { overview: { type: "string" }, components: { type: "array", items: { type: "string" } } }
    },
    advanced_diagnostic_flow: {
       type: "array",
       items: { type: "object", properties: { step_number: { type: "number" }, title: { type: "string" }, check: { type: "string" }, normal_result: { type: "string" }, danger_or_fail_result: { type: "string" }, next_action: { type: "string" } } }
    },
    mermaid_diagram: {
       type: "object",
       properties: { title: { type: "string" }, code: { type: "string" } }
    },
    repair_matrix: {
       type: "array",
       items: { type: "object", properties: { symptom: { type: "string" }, likely_issue: { type: "string" }, fix_type: { type: "string" }, difficulty: { type: "string" }, estimated_cost: { type: "string" } } }
    },
    repair_vs_replace: {
       type: "object",
       properties: { repair_when: { type: "string" }, replace_when: { type: "string" }, decision_note: { type: "string" } }
    },
    when_to_stop_diy: {
       type: "object",
       properties: { title: { type: "string" }, intro: { type: "string" }, danger_points: { type: "array", items: { type: "string" } }, conversion_body: { type: "string" }, cta_text: { type: "string" } }
    },
    prevention_tips: { type: "array", items: { type: "string" } },
    faqs: {
       type: "array",
       items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } }
    },
    internal_links: {
       type: "object",
       properties: { related_symptoms: { type: "array", items: { type: "string" } }, related_system_pages: { type: "array", items: { type: "string" } }, pillar_page: { type: "string" } }
    },
    bottom_cta: {
       type: "object",
       properties: { title: { type: "string" }, body: { type: "string" }, urgency_bullets: { type: "array", items: { type: "string" } }, button_text: { type: "string" } }
    },
    author_note: { type: "string" }
  }
};

export const Schema = DiagnosticPageSchema;
export type GeneratedContent = any; 

export const SCHEMA_STRING = JSON.stringify(DiagnosticPageSchema, null, 2);

export function getFallback(pageType: string): GeneratedContent {
  return {};
}
