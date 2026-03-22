import { generateTwoStagePage } from '../lib/content-engine/generator';
async function test() {
  try {
    const res = await generateTwoStagePage('AC keeps running', { slug: 'ac-keeps-running', system: 'HVAC', pageType: 'symptom' });
    console.log("SUCCESS");
  } catch (err) {
    console.error("FATAL", err);
  }
  process.exit(0);
}
test();
