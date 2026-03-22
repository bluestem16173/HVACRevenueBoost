import "dotenv/config";
import sql from '../lib/db';

async function runSmokeTest() {
  console.log("Starting Smoke Test on localhost:3002...");

  // Fetch all symptom slugs
  const pages = await sql`
    SELECT slug FROM pages 
    WHERE page_type = 'symptom' AND status IN ('published', 'generated')
  ` as { slug: string }[];

  console.log(`Found ${pages.length} pages to test.`);

  const results = {
    success: 0,
    errors: [] as { slug: string, status: number, error?: string }[]
  };

  // Process in batches of 5 to not overwhelm the local dev server
  const BATCH_SIZE = 5;
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (page) => {
      // slug should start with diagnose/ or similar. If it has a leading slash remove it just in case
      const cleanSlug = page.slug.startsWith('/') ? page.slug.slice(1) : page.slug;
      const url = `http://localhost:3002/${cleanSlug}`;
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          results.success++;
        } else {
          results.errors.push({ slug: cleanSlug, status: response.status });
          console.error(`❌ [${response.status}] ${url}`);
        }
      } catch (err: any) {
        results.errors.push({ slug: cleanSlug, status: 0, error: err.message });
        console.error(`🚨 [ERR] ${url}: ${err.message}`);
      }
    }));
  }

  console.log("\n--- Smoke Test Results ---");
  console.log(`Total Tested: ${pages.length}`);
  console.log(`✅ Success (200 OK): ${results.success}`);
  console.log(`❌ Failures: ${results.errors.length}`);
  if (results.errors.length > 0) {
    console.log("\nFailed URLs:");
    results.errors.forEach(e => {
      console.log(`  - /${e.slug} (Status: ${e.status}) ${e.error || ''}`);
    });
  }
  
  process.exit(results.errors.length > 0 ? 1 : 0);
}

runSmokeTest();
