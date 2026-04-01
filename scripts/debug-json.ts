import { generateDiagnosticEngineJson } from "../lib/content-engine/generator";
import fs from "fs";

async function render() {
  try {
    const result = await generateDiagnosticEngineJson({ symptom: "ac-leaking-water", city: "Florida", pageType: "diagnostic" });
    fs.writeFileSync("debug.json", JSON.stringify(result, null, 2));
    console.log("Wrote debug.json");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

render();
