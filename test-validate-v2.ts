import * as fs from 'fs';
import * as path from 'path';
import { validateDiagnostic } from './content-engine/src/lib/validation/validateDiagnostic';

const payloadPath = path.join(__dirname, 'data', 'v2-diagnose-hvac-blowing-warm-air.json');
const payloadRaw = fs.readFileSync(payloadPath, 'utf8');

try {
  const payload = JSON.parse(payloadRaw);
  const validated = validateDiagnostic(payload);
  console.log("Validation Successful!");
  console.log("Validated payload keys:", Object.keys(validated));
} catch (error) {
  console.error(error);
}
