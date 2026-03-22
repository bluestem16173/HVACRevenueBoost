import sql from '../lib/db';

async function fetchLatestUrls() {
  try {
    const pages = await sql`SELECT slug FROM pages WHERE status = 'published' ORDER BY updated_at DESC LIMIT 5`;
    
    console.log("Here are the latest generated URLs:");
    pages.forEach((p: any) => {
      // If the slug is 'diagnose/something', map it to local dev URL
      // If the website routing uses /repairs/ or /diagnose/, adjust accordingly.
      // Usually HVAC symptom pages are at /diagnose/slug or /repair/city/slug.
      console.log(`http://localhost:3000/${p.slug}`);
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

fetchLatestUrls();
