import "dotenv/config";
import { generateDiagnosticEngineJson } from "./lib/content-engine/generator";
import { validatePage } from "./lib/validators/page-validator";

async function run() {
  console.log("TESTING RAW GENERATION API");
  const slug = "ac-blowing-warm-air";
  
  const rawDg = await generateDiagnosticEngineJson(
    { symptom: slug, city: "", pageType: "symptom" },
    "",
    {
      system: "HVAC",
      coreOnly: false,
      schemaVersion: "v2_goldstandard",
      bypassAutoMode: true,
    }
  );

  console.log("--- KEY EXTRACTION ---");
  console.log(Object.keys(rawDg));

  console.log("repair_paths exist?", !!rawDg.repair_paths);
  console.log("comparison exist?", !!rawDg.comparison);
  console.log("problem_summary exist?", !!rawDg.problem_summary);

  console.log("--- VALIDATOR DRY RUN ---");
  const valRes = validatePage(rawDg);
  console.log(valRes);

  process.exit(0);
}

run();
