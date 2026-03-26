import 'dotenv/config';
import SymptomPage from '../app/diagnose/[symptom]/page';

async function run() {
  console.log('Starting render...');
  try {
    const slug = 'repair-or-replace-not-cooling-on-generator';
    const result = await SymptomPage({ params: { symptom: slug } });
    console.log('Render complete! Got result type:', typeof result);
  } catch (err) {
    console.error('Render threw an error:', err);
  }
  process.exit(0);
}

run().catch(console.error);
