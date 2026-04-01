import sql from '../db';

export function makeSlug(...parts: string[]) {
  return parts.filter(Boolean).join('-').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function upsertFailureMode(tx: any, system: string, mode: any) {
  const slug = makeSlug(system, mode.name);
  const result = await tx`
    INSERT INTO diagnostic_failure_modes (slug, name, description, system)
    VALUES (${slug}, ${mode.name}, ${mode.description}, ${system})
    ON CONFLICT (system, slug)
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      updated_at = now()
    RETURNING id
  `;
  return result[0].id;
}

export async function upsertCause(tx: any, system: string, cause: any, failureModeId: string) {
  const slug = makeSlug(system, cause.name);
  const result = await tx`
    INSERT INTO diagnostic_causes (
      slug, name, description, system, failure_mode_id, test, expected_result, severity
    )
    VALUES (
      ${slug}, ${cause.name}, ${cause.description}, ${system}, ${failureModeId},
      ${cause.test}, ${cause.expected_result}, ${cause.severity ?? null}
    )
    ON CONFLICT (system, slug)
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      failure_mode_id = EXCLUDED.failure_mode_id,
      test = EXCLUDED.test,
      expected_result = EXCLUDED.expected_result,
      severity = EXCLUDED.severity,
      updated_at = now()
    RETURNING id
  `;
  return result[0].id;
}

export async function upsertRepair(tx: any, system: string, repair: any) {
  const slug = makeSlug(system, repair.name);
  const result = await tx`
    INSERT INTO diagnostic_repairs (
      slug, name, description, difficulty, estimated_cost
    )
    VALUES (
      ${slug}, ${repair.name}, ${repair.description}, ${repair.difficulty}, ${repair.estimated_cost}
    )
    ON CONFLICT (slug)
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      difficulty = EXCLUDED.difficulty,
      estimated_cost = EXCLUDED.estimated_cost,
      updated_at = now()
    RETURNING id
  `;
  return result[0].id;
}

function fastAnswerForDb(fastAnswer: unknown): string {
  if (fastAnswer == null) return "";
  if (typeof fastAnswer === "string") return fastAnswer;
  return JSON.stringify(fastAnswer);
}

export async function upsertPage(tx: any, pageSlug: string, sourceId: string | null, payload: any) {
  const result = await tx`
    INSERT INTO diagnostic_pages (
      slug, title, symptom, system, fast_answer, mermaid_diagram, raw_json, source_page_id, source_table
    )
    VALUES (
      ${pageSlug}, ${payload.title}, ${payload.symptom}, ${payload.system},
      ${fastAnswerForDb(payload.fast_answer)}, ${payload.mermaid_diagram}, ${JSON.stringify(payload)}::jsonb, ${sourceId}, 'pages'
    )
    ON CONFLICT (slug)
    DO UPDATE SET
      title = EXCLUDED.title,
      symptom = EXCLUDED.symptom,
      system = EXCLUDED.system,
      fast_answer = EXCLUDED.fast_answer,
      mermaid_diagram = EXCLUDED.mermaid_diagram,
      raw_json = EXCLUDED.raw_json,
      source_page_id = EXCLUDED.source_page_id,
      updated_at = now()
    RETURNING id
  `;
  return result[0].id;
}

export async function clearPageRelations(tx: any, pageId: string) {
  await tx`DELETE FROM diagnostic_page_failure_modes WHERE page_id = ${pageId}`;
  await tx`DELETE FROM diagnostic_page_causes WHERE page_id = ${pageId}`;
  await tx`DELETE FROM diagnostic_guided_diagnosis WHERE page_id = ${pageId}`;
  await tx`DELETE FROM diagnostic_order_steps WHERE page_id = ${pageId}`;
}

export async function migrateOnePage(tx: any, sourceId: string | null, pageSlug: string, payload: any) {
  const pageId = await upsertPage(tx, pageSlug, sourceId, payload);
  await clearPageRelations(tx, pageId);

  const failureModeMap = new Map<string, string>();
  const sysName = payload.system || 'hvac';

  for (let i = 0; i < payload.failure_modes.length; i++) {
    const mode = payload.failure_modes[i];
    const modeId = await upsertFailureMode(tx, sysName, mode);
    failureModeMap.set(mode.name, modeId);

    await tx`
      INSERT INTO diagnostic_page_failure_modes (page_id, failure_mode_id, position)
      VALUES (${pageId}, ${modeId}, ${i})
      ON CONFLICT (page_id, failure_mode_id) DO NOTHING
    `;
  }

  const causeMap = new Map<string, string>();

  for (let i = 0; i < payload.causes.length; i++) {
    const cause = payload.causes[i];
    const failureModeId = failureModeMap.get(cause.failure_mode);
    if (!failureModeId) throw new Error(`Missing failure mode map for cause: ${cause.name}`);

    const causeId = await upsertCause(tx, sysName, cause, failureModeId);
    causeMap.set(cause.name, causeId);

    await tx`
      INSERT INTO diagnostic_page_causes (page_id, cause_id, position)
      VALUES (${pageId}, ${causeId}, ${i})
      ON CONFLICT (page_id, cause_id) DO NOTHING
    `;
  }

  for (const repair of payload.repairs) {
    const causeId = causeMap.get(repair.cause);
    if (!causeId) throw new Error(`Missing cause map for repair: ${repair.name}`);

    const repairId = await upsertRepair(tx, sysName, repair);

    const checkIdx = await tx`
      SELECT position FROM diagnostic_cause_repairs WHERE cause_id = ${causeId} ORDER BY position DESC LIMIT 1
    `;
    const position = checkIdx.length > 0 ? checkIdx[0].position + 1 : 0;

    await tx`
      INSERT INTO diagnostic_cause_repairs (cause_id, repair_id, position)
      VALUES (${causeId}, ${repairId}, ${position})
      ON CONFLICT (cause_id, repair_id) DO NOTHING
    `;
  }

  for (let i = 0; i < payload.guided_diagnosis.length; i++) {
    const gd = payload.guided_diagnosis[i];

    const gdResult = await tx`
      INSERT INTO diagnostic_guided_diagnosis (page_id, scenario, next_step, position)
      VALUES (${pageId}, ${gd.scenario}, ${gd.next_step}, ${i})
      RETURNING id
    `;
    const gdId = gdResult[0].id;

    for (const modeName of gd.likely_modes) {
      const modeId = failureModeMap.get(modeName);
      if (!modeId) throw new Error(`Missing mode map for guided diagnosis: ${modeName}`);

      await tx`
        INSERT INTO diagnostic_guided_diagnosis_modes (guided_diagnosis_id, failure_mode_id)
        VALUES (${gdId}, ${modeId})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  if (payload.diagnostic_order) {
    for (let i = 0; i < payload.diagnostic_order.length; i++) {
      await tx`
        INSERT INTO diagnostic_order_steps (page_id, step_text, position)
        VALUES (${pageId}, ${payload.diagnostic_order[i]}, ${i})
        ON CONFLICT (page_id, position) DO NOTHING 
      `;
    }
  }
}
