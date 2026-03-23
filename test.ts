import { getDiagnosticPageFromDB } from './lib/diagnostic-engine';

async function run() {
  try {
    const page = await getDiagnosticPageFromDB('ac-not-cooling-tampa', 'hybrid');
    console.log("DB PAGE:", page ? "FOUND" : "NULL");
  } catch (err) {
    console.log("ERR:", err);
  }
  process.exit(0);
}
run();
