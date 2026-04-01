/** Gold Standard Gate: reject soft copy + enforce technician pillars + measurables. */
function assertGoldTechnicalDepth(payload: any) {
  if (process.env.DECISIONGRID_DIAGNOSTIC_MODE !== "true") {
    return;
  }
  const fa = payload.fast_answer;
  if (!fa || typeof fa !== "object") {
    throw new Error("fast_answer must be an object with technical_summary and primary_mechanism");
  }
  const ts = String(fa.technical_summary ?? "");
  const pm = String(fa.primary_mechanism ?? "");
  const combined = `${ts} ${pm}`.toLowerCase();

  const hedge = /\b(may|might|could)\b/i;
  if (hedge.test(ts) || hedge.test(pm)) {
    throw new Error(
      "Gold gate: fast_answer must not use hedge words (may/might/could) in technical_summary or primary_mechanism"
    );
  }

  const pillar =
    /airflow|cfm|static|refrigerant|charge|superheat|subcool|enthalpy|condenser|evaporator|compressor|electrical|voltage|volt|amp|amperage|capacitor|contactor|motor|blower|duct|psi|°f|°\s*f|humidity|latent/i;
  if (!pillar.test(combined)) {
    throw new Error(
      "Gold gate: fast_answer must reference at least one system pillar (airflow/refrigerant/electrical) with domain terms"
    );
  }

  const measurable =
    /\d|°|delta|Δ|psi|subcool|superheat|cfm|ohm|vdc|vac|amp|°f|°c|psig|btuh|watts/i;
  if (!measurable.test(combined)) {
    throw new Error(
      "Gold gate: fast_answer must include measurable language (numbers, °F/°C, PSI, CFM, voltage, etc.)"
    );
  }

  for (const cause of payload.causes || []) {
    const mech = String(cause.mechanism ?? "");
    if (!mech.trim()) throw new Error(`Cause ${cause.name} missing mechanism`);
    if (hedge.test(mech)) {
      throw new Error(`Gold gate: cause ${cause.name} mechanism uses hedge words`);
    }
    if (!Array.isArray(cause.symptoms) || cause.symptoms.length < 1) {
      throw new Error(`Cause ${cause.name} must include symptoms[]`);
    }
    const sig = String(cause.diagnostic_signal ?? "");
    if (!sig.trim()) throw new Error(`Cause ${cause.name} missing diagnostic_signal`);
    if (typeof cause.confidence !== "number" || Number.isNaN(cause.confidence)) {
      throw new Error(`Cause ${cause.name} must have numeric confidence`);
    }
  }

  for (const repair of payload.repairs || []) {
    const se = String(repair.system_effect ?? "");
    if (!se.trim()) throw new Error(`Repair ${repair.name} missing system_effect`);
    if (hedge.test(se)) {
      throw new Error(`Gold gate: repair ${repair.name} system_effect uses hedge words`);
    }
  }
}

export function validateV2(payload: any) {
  if (!payload) throw new Error("Empty payload");

  const modeNames = new Set(payload.failure_modes?.map((m: any) => m.name));
  const causeNames = new Set(payload.causes?.map((c: any) => c.name));

  if (!payload.failure_modes || payload.failure_modes.length < 3) {
    throw new Error('At least 3 failure modes required');
  }

  // 1. Unique name checks
  if (modeNames.size !== payload.failure_modes.length) {
    throw new Error('Failure mode names must be unique');
  }
  if (causeNames.size !== payload.causes.length) {
    throw new Error('Cause names must be unique');
  }

  // 2. Reject Generic Failure Modes
  const bannedGenericModes = new Set([
    'Electrical Issues',
    'Airflow Issues',
    'Refrigerant Problems',
    'Mechanical Issues',
    'Control Issues',
    'General',
    'System',
    'Other', 
    'Unknown',
    'Miscellaneous',
    'General Issues'
  ]);
  for (const mode of payload.failure_modes) {
    if (bannedGenericModes.has(mode.name.trim())) {
      throw new Error(`Failure mode too generic: ${mode.name}`);
    }
  }

  // 3. Causes ownership and tests
  for (const cause of payload.causes || []) {
    if (!modeNames.has(cause.failure_mode)) {
      throw new Error(`Cause ${cause.name} has invalid failure mode`);
    }
    if (!cause.test || !cause.test.trim()) {
      throw new Error(`Cause ${cause.name} missing test`);
    }
    if (!cause.expected_result || !cause.expected_result.trim()) {
      throw new Error(`Cause ${cause.name} missing expected_result`);
    }

    const testMeasurableKeywords = ['measure', 'inspect', 'check', 'test', 'read', 'verify', 'voltage', 'ohm', 'psi', 'temperature', 'continuity', 'multimeter', 'gauge', 'meter', 'observe', 'listen', 'disconnect', 'discharge'];
    const hasMeasurable = testMeasurableKeywords.some(kw => cause.test.toLowerCase().includes(kw)) || /\d+/.test(cause.test);
    if (!hasMeasurable) {
      throw new Error(`Cause ${cause.name} test lacks measurable condition: ${cause.test}`);
    }

    const resultPassFailKeywords = ['confirm', 'indicate', 'below', 'above', 'within', 'range', 'should be', 'normal', 'abnormal', 'pass', 'fail', 'detect', 'present', 'eliminates'];
    const hasPassFail = resultPassFailKeywords.some(kw => cause.expected_result.toLowerCase().includes(kw)) || /\d+/.test(cause.expected_result);
    if (!hasPassFail) {
      throw new Error(`Cause ${cause.name} expected_result lacks decisive pass/fail outcome: ${cause.expected_result}`);
    }
  }

  // 4. Repairs mapping
  for (const repair of payload.repairs || []) {
    if (!causeNames.has(repair.cause)) {
      throw new Error(`Repair ${repair.name} points to unknown cause`);
    }
  }

  // 5. Failure mode has causes
  for (const mode of payload.failure_modes) {
    const count = payload.causes.filter((c: any) => c.failure_mode === mode.name).length;
    if (count === 0) {
      throw new Error(`Failure mode ${mode.name} has no causes`);
    }
  }

  // 6. Mermaid validation
  if (!payload.mermaid_diagram || !payload.mermaid_diagram.includes('flowchart TD')) {
    throw new Error('Mermaid diagram must use flowchart TD');
  }
  for (const mode of payload.failure_modes) {
    if (!payload.mermaid_diagram.includes(mode.name)) {
      throw new Error(`Mermaid missing failure mode ${mode.name}`);
    }
  }
  if (!payload.mermaid_diagram.includes('?')) {
    throw new Error("Mermaid missing binary questions (?)");
  }

  // 7. Guided diagnosis strict checks
  if (!payload.guided_diagnosis || payload.guided_diagnosis.length < 3) {
    throw new Error('Guided diagnosis requires at least 3 scenarios');
  }
  for (const gd of payload.guided_diagnosis) {
    for (const mode of gd.likely_modes || []) {
      if (!modeNames.has(mode)) {
        throw new Error(`Guided diagnosis references unknown mode: ${mode}`);
      }
    }
  }

  // 8. Anti-blog checks (object fast_answer)
  if (payload.fast_answer && typeof payload.fast_answer === "object") {
    const blob = JSON.stringify(payload.fast_answer);
    if (blob.includes("This article")) throw new Error("Contains blog jargon: 'This article'");
    if (blob.includes("In this guide")) throw new Error("Contains blog jargon: 'In this guide'");
  }

  assertGoldTechnicalDepth(payload);

  return true;
}
