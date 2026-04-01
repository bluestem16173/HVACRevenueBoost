/** Plan batches from targets + budget — wire to orchestrator_runs */
export function planBatch(_opts: { maxCost: number; batchSize: number }) {
  return { planned: [] as string[] };
}
