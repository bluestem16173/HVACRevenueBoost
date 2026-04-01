import { generateDiagnosticEngineJson } from "../ai/generateDiagnosticEngineJson";
import { validateDiagnostic } from "../validation/validateDiagnostic";
import { scoreDiagnostic } from "../quality/scoreDiagnostic";
import { getFallbackIntro } from "../Render/diagnosticIntroCatalog";

export async function processDiagnosticPageQueue(items: any[]) {
  console.log(`[Queue Worker] Processing ${items.length} diagnostic items`);
  for (const item of items) {
    try {
      // 1. Generate JSON based on strict v2 schema
      const payload = await generateDiagnosticEngineJson(
        item.slug, 
        item.system || "", 
        item.extraContext || "", 
        true
      );
      
      // 2. Add fallback intro if missing (Intro catalog fallback)
      if (!payload.diagnosticIntro) {
        payload.diagnosticIntro = getFallbackIntro(item.slug) || undefined;
      }

      // 3. Strict schema validation
      const validatedPayload = validateDiagnostic(payload);
      
      // 4. Score content payload quality
      const quality_score = scoreDiagnostic(validatedPayload);

      // 5. Envelope mapping per v2 schema requirements
      const content_json = {
        schema_version: "v2",
        diagnostic_indexing: true,
        quality_score,
        model_confidence: validatedPayload.confidence_score || 0,
        payload: validatedPayload
      };
      
      console.log(`[Queue Worker] Successfully processed ${item.slug} (Score: ${quality_score})`);
      // db.update({ content_json }) would follow here
      
    } catch (e: any) {
      console.error(`[Queue Worker] Failed processing ${item.slug}:`, e.message);
    }
  }
}
