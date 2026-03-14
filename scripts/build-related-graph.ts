/**
 * Phase 16: Related Nodes Graph Builder
 * Generates 4-8 related nodes per page for dense internal linking.
 * Relation types: related-problem, similar-cause, alternative-repair,
 *                 same-component-family, same-condition-family, same-system-cluster
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import sql from "@/lib/db";
import { CLUSTERS } from "@/lib/clusters";
import { CONDITIONS } from "@/lib/conditions";
import { SYMPTOMS, CAUSES, REPAIRS } from "@/data/knowledge-graph";

const MIN_SCORE = 0.3;
const MAX_RELATED = 8;

type RelationType =
  | "related-problem"
  | "similar-cause"
  | "alternative-repair"
  | "same-component-family"
  | "same-condition-family"
  | "same-system-cluster";

interface RelatedNode {
  source_type: string;
  source_slug: string;
  target_type: string;
  target_slug: string;
  relation_type: RelationType;
  score: number;
  is_bidirectional: boolean;
}

async function ensureTable() {
  // Migration 003 creates this; ensure for local dev
  await sql`
    CREATE TABLE IF NOT EXISTS related_nodes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      source_slug TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_slug TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      score NUMERIC DEFAULT 1,
      is_bidirectional BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  try {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_related_nodes_unique ON related_nodes(source_slug, target_slug, relation_type)`;
  } catch {}
}

function getClusterForSymptom(symptomId: string): string | null {
  const c = CLUSTERS.find((cl) => cl.symptomIds.includes(symptomId));
  return c?.slug || null;
}

async function buildSymptomRelations(): Promise<RelatedNode[]> {
  const nodes: RelatedNode[] = [];

  for (const symptom of SYMPTOMS) {
    const clusterSlug = getClusterForSymptom(symptom.id);
    const symptomCauses = symptom.causes || [];

    // same-system-cluster: other symptoms in same cluster
    if (clusterSlug) {
      const cluster = CLUSTERS.find((c) => c.slug === clusterSlug);
      if (cluster) {
        const siblings = cluster.symptomIds
          .filter((id) => id !== symptom.id)
          .slice(0, 4);
        for (const sibId of siblings) {
          const sib = SYMPTOMS.find((s) => s.id === sibId);
          if (sib) {
            nodes.push({
              source_type: "symptom",
              source_slug: `diagnose/${symptom.id}`,
              target_type: "symptom",
              target_slug: `diagnose/${sib.id}`,
              relation_type: "same-system-cluster",
              score: 0.9,
              is_bidirectional: true,
            });
          }
        }
      }
    }

    // related-problem: symptoms sharing causes
    const sharedCauseSymptoms = SYMPTOMS.filter(
      (s) =>
        s.id !== symptom.id &&
        (s.causes || []).some((c) => symptomCauses.includes(c))
    )
      .slice(0, 3)
      .map((s) => ({
        source_type: "symptom",
        source_slug: `diagnose/${symptom.id}`,
        target_type: "symptom",
        target_slug: `diagnose/${s.id}`,
        relation_type: "related-problem" as RelationType,
        score: 0.7,
        is_bidirectional: true,
      }));
    nodes.push(...sharedCauseSymptoms);
  }

  return nodes;
}

async function buildConditionRelations(): Promise<RelatedNode[]> {
  const nodes: RelatedNode[] = [];

  for (const cond of CONDITIONS) {
    const siblingConditions = CONDITIONS.filter(
      (c) => c.symptomId === cond.symptomId && c.slug !== cond.slug
    );
    for (const sib of siblingConditions.slice(0, 4)) {
      nodes.push({
        source_type: "condition",
        source_slug: `conditions/${cond.slug}`,
        target_type: "condition",
        target_slug: `conditions/${sib.slug}`,
        relation_type: "same-condition-family",
        score: 0.95,
        is_bidirectional: true,
      });
    }
  }

  return nodes;
}

async function buildCauseRelations(): Promise<RelatedNode[]> {
  const nodes: RelatedNode[] = [];

  for (const [causeSlug, cause] of Object.entries(CAUSES)) {
    const component = cause.component;
    const repairs = cause.repairs || [];

    // similar-cause: same component
    const sameComponentCauses = Object.entries(CAUSES)
      .filter(
        ([slug, c]) =>
          slug !== causeSlug && c.component === component
      )
      .slice(0, 3);
    for (const [targetSlug] of sameComponentCauses) {
      nodes.push({
        source_type: "cause",
        source_slug: `cause/${causeSlug}`,
        target_type: "cause",
        target_slug: `cause/${targetSlug}`,
        relation_type: "same-component-family",
        score: 0.8,
        is_bidirectional: true,
      });
    }

    // alternative-repair: repairs for this cause
    for (const repairId of repairs.slice(0, 2)) {
      nodes.push({
        source_type: "cause",
        source_slug: `cause/${causeSlug}`,
        target_type: "repair",
        target_slug: `fix/${repairId}`,
        relation_type: "alternative-repair",
        score: 1,
        is_bidirectional: false,
      });
    }
  }

  return nodes;
}

async function buildRepairRelations(): Promise<RelatedNode[]> {
  const nodes: RelatedNode[] = [];

  for (const [repairSlug, repair] of Object.entries(REPAIRS)) {
    const component = repair.component;

    // alternative-repair: same component
    const sameComponentRepairs = Object.entries(REPAIRS)
      .filter(
        ([slug, r]) =>
          slug !== repairSlug && r.component === component
      )
      .slice(0, 3);
    for (const [targetSlug] of sameComponentRepairs) {
      nodes.push({
        source_type: "repair",
        source_slug: `fix/${repairSlug}`,
        target_type: "repair",
        target_slug: `fix/${targetSlug}`,
        relation_type: "same-component-family",
        score: 0.85,
        is_bidirectional: true,
      });
    }
  }

  return nodes;
}

async function insertNodes(nodes: RelatedNode[]) {
  const seen = new Set<string>();
  let inserted = 0;

  for (const n of nodes) {
    const key = `${n.source_slug}|${n.target_slug}|${n.relation_type}`;
    if (seen.has(key)) continue;
    seen.add(key);

    try {
      await sql`
        INSERT INTO related_nodes (source_type, source_id, source_slug, target_type, target_id, target_slug, relation_type, score, is_bidirectional)
        VALUES (${n.source_type}, ${n.source_slug}, ${n.source_slug}, ${n.target_type}, ${n.target_slug}, ${n.target_slug}, ${n.relation_type}, ${n.score}, ${n.is_bidirectional})
      `;
      inserted++;
    } catch (e: any) {
      if (e?.code !== "23505") throw e; // ignore unique violation
    }
  }

  return inserted;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  console.log("🔗 Building related nodes graph...\n");

  await ensureTable();

  const symptomNodes = await buildSymptomRelations();
  const conditionNodes = await buildConditionRelations();
  const causeNodes = await buildCauseRelations();
  const repairNodes = await buildRepairRelations();

  const all = [...symptomNodes, ...conditionNodes, ...causeNodes, ...repairNodes];
  console.log(`  Symptoms: ${symptomNodes.length}`);
  console.log(`  Conditions: ${conditionNodes.length}`);
  console.log(`  Causes: ${causeNodes.length}`);
  console.log(`  Repairs: ${repairNodes.length}`);
  console.log(`  Total: ${all.length}`);

  const inserted = await insertNodes(all);
  console.log(`\n✅ Inserted ${inserted} related nodes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
