/**
 * Normalizes and validates AI-generated data before it enters the database.
 * Enforces strict schema and logs schema drift from the LLM.
 */

export function normalizeAuthorityJson(raw: any) {
  // Since we now use a STRICT Force-Correct Master Prompt, 
  // normalization is a passthrough with minor fallbacks if absolutely necessary.
  return raw;
}

export function validateAuthorityJson(data: any, pageType?: string) {
  const required = [
    "title",
    "intro",
    "urgencyLevel",
    "systemExplanation",
    "decision_tree",
    "diagnosticFlow",
    "likelyIssues",
    "quickChecks",
    "repairOptions",
    "leadSignals",
    "primaryCTA"
  ];

  // For symptom pages (or generally all Authority formats), strictly validate
  for (const key of required) {
    if (!data[key]) {
      throw new Error(`❌ Missing required field: ${key}`);
    }
  }

  if (typeof data.decision_tree !== "string") {
    throw new Error("❌ decision_tree must be string");
  }

  // Enforce Primary CTA Monetization Rule
  if (!data?.primaryCTA?.url?.includes("{{GHL_CTA_URL}}")) {
    throw new Error("❌ Missing above-the-fold CTA or {{GHL_CTA_URL}} variable injection");
  }

  // The prompt hash lock is validated in the worker since the worker is aware of the EXPECTED hash.

  return true;
}

/** Transform two-stage (symptom) output to ConditionPageTemplate schema when pageType is condition */
function transformToConditionSchema(data: any, slug: string): any {
  const baseSlug = (slug || "").replace(/^conditions\/?/, "");
  const toSlug = (s: string) => String(s || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const likelyIssues = Array.isArray(data.likelyIssues) ? data.likelyIssues : [];
  const repairOpts = Array.isArray(data.repairOptions) ? data.repairOptions : [];
  const diagFlow = Array.isArray(data.diagnosticFlow) ? data.diagnosticFlow : [];
  const quickChecks = Array.isArray(data.quickChecks) ? data.quickChecks : [];

  return {
    ...data,
    title: data.title || baseSlug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
    summary: data.intro || data.title || "",
    fastAnswer: {
      headline: data.title || "Quick Answer",
      body: data.intro || "",
      severity: data.urgencyLevel === "high" ? "high" : data.urgencyLevel === "medium" ? "medium" : "low",
      timeSensitivity: data.urgencyLevel === "high" ? "urgent" : data.urgencyLevel === "medium" ? "soon" : "monitor",
    },
    thirtySecondSummary: {
      whatItUsuallyMeans: likelyIssues[0]?.issue || likelyIssues[0]?.description || data.intro?.slice(0, 120) || "",
      mostLikelyFix: repairOpts[0]?.option || repairOpts[0]?.description || "Professional diagnosis recommended.",
      diyPotential: quickChecks.length > 0 ? `Try: ${quickChecks[0]}` : "Limited without tools.",
      callProWhen: data.leadSignals?.reason || "When DIY checks don't resolve the issue.",
    },
    whatThisMeans: {
      headline: "What This Means",
      body: data.intro || "",
      technicalNote: (data.systemExplanation as string[])?.[0] || "",
    },
    primaryCauses: likelyIssues.slice(0, 5).map((i: any, idx: number) => ({
      name: i.issue || i.name || `Cause ${idx + 1}`,
      slug: toSlug(i.issue || i.name || `cause-${idx + 1}`),
      likelihood: i.severity === "high" ? "common" : i.severity === "medium" ? "possible" : "less-common",
      whyItCausesThis: (i.description || "").slice(0, 400) || "Can contribute to this symptom. Have a technician verify.",
      confirmSignals: quickChecks.slice(0, 4).length > 0 ? quickChecks.slice(0, 4) : ["Check system operation", "Verify airflow and temperature"],
    })),
    diagnosticFlowMermaid: data.decision_tree || "flowchart TD\n  A[Start] --> B[Check system]",
    symptomsYoullNotice: [
      ...(Array.isArray(data.systemExplanation) ? data.systemExplanation.slice(0, 4) : []),
      ...quickChecks.slice(0, 6),
    ].filter(Boolean).slice(0, 8),
    howToConfirm: diagFlow.slice(0, 6).map((d: any, idx: number) => ({
      step: idx + 1,
      action: (d.question || d.title || d.action || String(d.step || "")).slice(0, 200) || `Step ${idx + 1}: Check system`,
      goodResult: (d.yes || "Normal").slice(0, 150) || "System responds as expected.",
      badResult: (d.no || "Needs attention").slice(0, 150) || "Indicates a problem. Consider professional diagnosis.",
      safety: "Turn off power before inspecting. Use caution around electrical components.",
    })),
    repairOptions: repairOpts.slice(0, 6).map((r: any) => ({
      repair: r.option || r.name || r.repair || "",
      slug: toSlug(r.option || r.name || r.repair || "repair"),
      diyLevel: r.type === "DIY" ? "easy" : r.type === "professional" ? "pro-only" : "moderate",
      typicalUseCase: (r.description || r.typicalUseCase || "").slice(0, 200) || "Common fix for this symptom.",
      notes: (r.estimatedCost ? `Est. ${r.estimatedCost}` : r.notes || r.time || "").slice(0, 100) || "Costs vary by region.",
    })),
    costSnapshot: {
      diyRange: repairOpts.find((r: any) => r.type === "DIY")?.estimatedCost || "$20–200",
      proRange: repairOpts.find((r: any) => r.type === "professional")?.estimatedCost || "$150–800",
      majorRepairRange: "$500–2500",
      costNote: "Costs vary by region and system.",
    },
    ifIgnored: {
      shortTerm: (data.leadSignals?.reason || "Efficiency may drop; system works harder.").slice(0, 200),
      mediumTerm: "Component wear can increase. Higher energy bills. Reduced comfort.",
      worstCase: "System failure, refrigerant loss, or safety risk. Don't delay repairs.",
    },
    toolsAndParts: {
      tools: [...quickChecks.slice(0, 3), "Multimeter (optional)", "Thermometer"].filter((t, i, a) => a.indexOf(t) === i).slice(0, 5),
      parts: repairOpts.slice(0, 2).map((r: any) => r.option || r.name || r.part || "").filter(Boolean),
    },
    technicianInsight: {
      headline: "Technician Insight",
      body: (data.intro || "").slice(0, 300) + (data.leadSignals?.reason ? ` ${data.leadSignals.reason}` : "").slice(0, 200) || "Have a qualified technician inspect the system for an accurate diagnosis.",
    },
    commonMisdiagnoses: ["Thermostat settings wrong", "Dirty or clogged filter", "Breaker tripped", "Wrong mode selected"].slice(0, 4),
    preventionTips: [...quickChecks.slice(0, 4), "Change filters regularly", "Schedule annual maintenance"].filter(Boolean).slice(0, 6),
    whenToCall: {
      now: data.leadSignals?.callNow ? [data.leadSignals.reason, "No cooling at all", "Strange odors or noises"] : [],
      soon: ["If quick checks don't help", "Temperature not reaching setpoint", "System runs constantly"],
      canMonitor: ["If system runs but underperforms", "Mild discomfort only", "Slight efficiency drop"],
    },
    relatedDiagnoseGuides: likelyIssues.slice(0, 3).map((i: any) => ({
      title: i.issue || i.name || "Related diagnostic",
      slug: toSlug(i.issue || i.name || "diagnose"),
    })),
    relatedProblems: likelyIssues.slice(0, 3).map((i: any) => ({
      title: i.issue || i.name || "Related problem",
      slug: toSlug(i.issue || i.name || "condition"),
    })),
    repairLinks: repairOpts.slice(0, 5).map((r: any) => ({
      title: r.option || r.name || r.repair,
      slug: toSlug(r.option || r.name || r.repair),
    })),
    faq: [
      ...likelyIssues.slice(0, 4).map((i: any) => ({
        question: `Is ${i.issue || i.name} a common cause?`,
        answer: (i.description || "").slice(0, 250) || "Yes, it's a frequent cause. Have it checked by a pro.",
      })),
      { question: "When should I call a professional?", answer: (data.leadSignals?.reason || "When DIY checks don't resolve the issue or you notice safety concerns.").slice(0, 200) },
      { question: "How much does repair typically cost?", answer: "Costs vary widely: DIY fixes $20–200, pro repairs $150–800, major work $500–2500." },
    ].filter((f) => f.question && f.answer).slice(0, 6),
    cta: data.primaryCTA ? {
      headline: data.primaryCTA.headline || "Get Help",
      body: data.primaryCTA.subtext || "",
      buttonText: data.primaryCTA.buttonText || "Find a Pro",
    } : { headline: "Get Professional Help", body: "", buttonText: "Find a Pro" },
  };
}

export function finalizeAuthorityJson(data: any, pageType?: string) {
  validateAuthorityJson(data, pageType);
  const slug = data.slug || "";
  if (pageType === "condition") {
    return {
      ...transformToConditionSchema(data, slug),
      _status: "finalized",
      finalized_at: new Date().toISOString(),
    };
  }
  return {
    ...data,
    _status: "finalized",
    finalized_at: new Date().toISOString(),
  };
}
