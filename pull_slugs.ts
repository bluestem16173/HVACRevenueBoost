import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result24h = await sql`SELECT slug, status FROM pages WHERE updated_at >= NOW() - INTERVAL '24 hours' ORDER BY updated_at DESC`;
  
  const publishedCount = result24h.filter(r => r.status === 'published').length;
  const pendingCount = result24h.filter(r => r.status === 'pending').length;
  
  let mdContent = `# Pages Generated in the Last 24 Hours\n\n`;
  mdContent += `Total: **${result24h.length}**\n`;
  mdContent += `- Published: ${publishedCount}\n`;
  mdContent += `- Pending: ${pendingCount}\n\n`;
  mdContent += `## Published Slugs\n`;
  
  const published = result24h.filter(r => r.status === 'published');
  for (const page of published) {
    // Generate a full URL if possible, or just the slug
    mdContent += `- [${page.slug}](http://localhost:3000/${page.slug})\n`;
  }
  
  if (pendingCount > 0) {
    mdContent += `\n## Pending Slugs\n`;
    const pending = result24h.filter(r => r.status === 'pending');
    for (const page of pending) {
      mdContent += `- ${page.slug}\n`;
    }
  }

  const outPath = `C:\\Users\\anedo\\.gemini\\antigravity\\brain\\db563eb9-0bc0-4337-ba9b-a51ed98a85c0\\recent_slugs.md`;
  
  fs.writeFileSync(outPath, mdContent);
  console.log(`Wrote ${result24h.length} slugs to ${outPath}`);
}
main().catch(console.error);
