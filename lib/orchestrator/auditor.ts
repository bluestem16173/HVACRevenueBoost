import sql from "@/lib/db";

export type AuditScore = {
  run_id: string;
  page_slug: string;
  structure_score: number;
  seo_score: number;
  graph_score: number;
  content_score: number;
  status_band: string;
  recommendations: Array<{ issue: string; action: string; priority: string; auto_fixable: boolean; prompt_flags?: any }>;
};

export async function auditPage(run_id: string, slug: string): Promise<AuditScore | null> {
  const result = await sql`SELECT content_json FROM pages WHERE slug = ${slug} LIMIT 1`;
  if (!result || result.length === 0) return null;

  const page = result[0].content_json;
  if (!page) return null;

  let structureScore = 0;
  let seoScore = 0;
  let graphScore = 0;
  let contentScore = 0;
  const recommendations: any[] = [];

  // 1. Structure (Weight 35)
  if (page.failure_modes && page.failure_modes.length >= 3) structureScore += 15;
  else recommendations.push({ issue: "low_failure_modes", action: "regenerate_with_failure_expansion", priority: "high", auto_fixable: true, prompt_flags: { "min_failure_modes": 3 } });

  let totalRepairs = 0;
  if (page.failure_modes) {
    page.failure_modes.forEach((mode: any) => {
      if (mode.causes) {
        mode.causes.forEach((cause: any) => {
          if (cause.repairs) totalRepairs += cause.repairs.length;
        });
      }
    });
  }

  if (totalRepairs >= 5) structureScore += 20;
  else if (totalRepairs >= 3) {
    structureScore += 10;
    recommendations.push({ issue: "low_repairs", action: "regenerate_with_repair_expansion", priority: "medium", auto_fixable: true, prompt_flags: { "min_repairs": 5 } });
  } else {
    recommendations.push({ issue: "critical_low_repairs", action: "regenerate_with_repair_expansion", priority: "high", auto_fixable: true, prompt_flags: { "min_repairs": 5 } });
  }

  // 2. SEO (Weight 20)
  if (page.title && page.title.length > 20) seoScore += 5;
  const fastAnswerLen =
    typeof page.fast_answer === "string"
      ? page.fast_answer.length
      : page.fast_answer
        ? JSON.stringify(page.fast_answer).length
        : 0;
  if (fastAnswerLen > 50) seoScore += 15;
  else
    recommendations.push({
      issue: "weak_fast_answer",
      action: "regenerate_fast_answer",
      priority: "high",
      auto_fixable: true,
      prompt_flags: { fast_answer_length: "> 50 chars" },
    });

  // 3. Graph (Weight 25)
  if (page.mermaid_diagram && page.mermaid_diagram.includes("flowchart TD")) {
    graphScore += 15;
    if (page.mermaid_diagram.split("\\n").length > 6) graphScore += 10;
  } else {
    recommendations.push({ issue: "missing_mermaid", action: "regenerate_with_schema_enforcement", priority: "critical", auto_fixable: true, prompt_flags: { "force_mermaid": true } });
  }

  // 4. Content (Weight 20)
  if (page.costs && page.costs.length >= 2) contentScore += 10;
  else recommendations.push({ issue: "missing_cost_matrix", action: "regenerate_with_cost_focus", priority: "medium", auto_fixable: true, prompt_flags: { "min_cost_entries": 2 } });

  if (page.guided_diagnosis && page.guided_diagnosis.length >= 3) contentScore += 10;
  else recommendations.push({ issue: "shallow_diagnosis", action: "regenerate_with_diagnosis_expansion", priority: "high", auto_fixable: true, prompt_flags: { "min_guided_diagnosis_steps": 3 } });

  const totalScore = structureScore + seoScore + graphScore + contentScore;
  let statusBand = "failed";
  if (totalScore >= 90) statusBand = "excellent";
  else if (totalScore >= 75) statusBand = "solid";
  else if (totalScore >= 60) statusBand = "warn";

  return {
    run_id,
    page_slug: slug,
    structure_score: structureScore,
    seo_score: seoScore,
    graph_score: graphScore,
    content_score: contentScore,
    status_band: statusBand,
    recommendations
  };
}

export async function runBulkAudit(run_id: string): Promise<void> {
  // get all generated pages in this run
  const pages = await sql`SELECT slug FROM orchestrator_run_pages WHERE run_id = ${run_id} AND status = 'created'`;
  
  for (const row of pages) {
    const audit = await auditPage(run_id, row.slug);
    if (audit) {
      await sql`
        INSERT INTO orchestrator_page_audits (
          run_id, page_slug, structure_score, seo_score, graph_score, content_score, status_band, recommendations
        ) VALUES (
          ${audit.run_id}, ${audit.page_slug}, ${audit.structure_score}, ${audit.seo_score}, 
          ${audit.graph_score}, ${audit.content_score}, ${audit.status_band}, ${JSON.stringify(audit.recommendations)}::jsonb
        )
      `;
    }
  }
}
