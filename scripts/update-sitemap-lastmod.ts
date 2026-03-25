import fs from "fs";
import sql from "../lib/db";

async function updateSitemap() {
  console.log("Fetching recently updated pages for sitemap lastmod...");
  
  try {
    const pages = await sql`
      SELECT slug, updated_at
      FROM pages
      WHERE updated_at > NOW() - INTERVAL '7 days'
    `;

    if (fs.existsSync("public/sitemap.xml")) {
      let sitemap = fs.readFileSync("public/sitemap.xml", "utf-8");
      let updateCount = 0;

      for (const page of pages as any[]) {
        const url = `<loc>https://hvac-revenue-boost.vercel.app/${page.slug}</loc>`;
        const lastmod = `<lastmod>${new Date(page.updated_at).toISOString()}</lastmod>`;

        const regex = new RegExp(`${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?<lastmod>.*?</lastmod>`);
        
        if (regex.test(sitemap)) {
          sitemap = sitemap.replace(regex, `${url}\n    ${lastmod}`);
          updateCount++;
        }
      }

      fs.writeFileSync("public/sitemap.xml", sitemap);
      console.log(`Updated ${updateCount} static sitemap entries.`);
    } else {
      console.log(`Project uses dynamic sitemap.xml route. ${pages.length} pages are ready for crawl. To ping Google: GET https://www.google.com/ping?sitemap=https://hvac-revenue-boost.vercel.app/sitemap.xml`);
    }
  } catch (err: any) {
    console.error("Failed to update sitemap:", err.message);
  }
  
  process.exit(0);
}

updateSitemap();
