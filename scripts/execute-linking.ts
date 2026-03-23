import { runLinkingPass } from "../lib/linking/run-linking-pass";

async function main() {
  console.log("Starting linking pass for DecisionGrid (DG)...");
  const result = await runLinkingPass("dg");
  console.log(`Finished linking pass. Processed ${result.processed} rows.`);
  process.exit(0);
}

main().catch(console.error);
