import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import sql from '../lib/db';
import { generateDiagnosticEngineJson } from '../lib/content-engine/generator';
import { validateV2 } from '../lib/validators/validate-v2';
import { migrateOnePage } from '../lib/content-engine/relational-upsert';

async function run() {
  const canarySlug = process.env.CANARY_SLUG || 'ac-blowing-warm-air';
  console.log(`🐤 Starting Master Canary DB Regeneration: ${canarySlug}`);
  
  try {
    const rawDg = await generateDiagnosticEngineJson(
      { symptom: canarySlug, city: 'Florida', pageType: 'symptom' },
      '',
      {}
    );
    
    console.log("📦 Payload generated. Validating strictly against V2 schema...");
    validateV2(rawDg);
    
    console.log("✅ Schema passes strict test constraints. Pushing deep relational nodes...");
    await migrateOnePage(sql, null, canarySlug, rawDg);
    
    console.log(`✅ Canary inserted securely for ${canarySlug}!`);
    process.exit(0);
  } catch(e: any) {
    console.error("❌ Canary Failed fatally:", e);
    process.exit(1);
  }
}

run();
