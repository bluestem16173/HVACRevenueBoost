import 'dotenv/config';
import { getSymptomWithCausesFromDB, getDiagnosticPageFromDB } from '../lib/diagnostic-engine';
import { getInternalLinksForPage } from '../lib/seo-linking';
import { buildLinksForPage } from '../lib/link-engine';
import { getToolsForPage } from '../lib/tools-for-page';
import { getComponentsForPage } from '../lib/components-for-page';

async function run() {
  const slug = 'rv-low-water-pressure'; // user's slug
  console.log('1. getSymptomWithCausesFromDB');
  await getSymptomWithCausesFromDB(slug);
  
  console.log('2. getDiagnosticPageFromDB');
  await getDiagnosticPageFromDB(slug, 'diagnostic');
  
  console.log('3. getInternalLinksForPage');
  await getInternalLinksForPage(slug);
  
  console.log('4. buildLinksForPage');
  await buildLinksForPage("symptom", `diagnose/${slug}`, { symptomId: slug });
  
  console.log('5. getToolsForPage');
  await getToolsForPage(slug);
  
  console.log('6. getComponentsForPage');
  await getComponentsForPage(slug);
  
  console.log('DONE!');
  process.exit(0);
}

run().catch(console.error);
