import { generateDiagnosticEngineJson } from "../lib/content-engine/generator";
import * as fs from "fs";

async function run() {
  console.log("🚀 Running Canary Generation for: ac-leaking-water");
  try {
    const output = await generateDiagnosticEngineJson({
      symptom: "ac-leaking-water",
      city: "Tampa",
      pageType: "diagnose"
    });
    
    fs.writeFileSync("dg-test-output.json", JSON.stringify(output, null, 2));
    console.log("✅ Successfully generated DG Payload! Saved to dg-test-output.json");
    
  } catch (err) {
    console.error("❌ Generation Failed:", err);
  }
}

run();
