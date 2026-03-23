import 'dotenv/config';
import { generateDiagnosticEngineJson, transformDGToUnified } from '../lib/content-engine/generator';
import { Schema } from '../lib/content-engine/schema';
import { EXPECTED_PROMPT_HASH } from '../lib/content-engine/core';

async function test() {
  const slug = 'ac-not-turning-on';
  const pageType = 'symptom';
  try {
    console.log("Generating DG payload...");
    const rawDg = await generateDiagnosticEngineJson(slug, { slug, system: 'HVAC', pageType });
    console.log("DG payload keys:", Object.keys(rawDg));
    
    console.log("Transforming to unified format...");
    const transformed = transformDGToUnified(rawDg, slug, pageType);
    
    console.log("Parsing with Unified Schema...");
    const parsedResult = Schema.parse(transformed);
    console.log("Schema parsed successfully!");
  } catch(e: any) {
    console.error("FAILED.");
    if (e.issues) {
      console.error(JSON.stringify(e.issues, null, 2));
    } else {
      console.error(e);
    }
  }
}
test();
