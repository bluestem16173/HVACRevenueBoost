import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, '../templates');

const templatesToUpdate = [
  'component-page.tsx',
  'cost-page.tsx',
  'maintenance-page.tsx',
  'emergency-page.tsx',
  'cause-page.tsx',
  'symptom-page.tsx',
  'repair-page.tsx'
];

async function run() {
  for (const template of templatesToUpdate) {
    const filePath = path.join(templatesDir, template);
    try {
      let content = await fs.readFile(filePath, 'utf8');

      if (!content.includes('RelatedTopics')) {
        // Add import at the top
        content = `import { RelatedTopics } from "@/components/hub/RelatedTopics";\n` + content;
        
        // Find the absolute last occurrence of closing div before final parenthesis
        const injectPoint = content.lastIndexOf('</div>\n  );\n}');
        if (injectPoint !== -1) {
          content = content.substring(0, injectPoint) + '      <RelatedTopics />\n    ' + content.substring(injectPoint);
          await fs.writeFile(filePath, content, 'utf8');
          console.log(`✅ Injected RelatedTopics into ${template}`);
        } else {
          console.log(`❌ Failed to find injection site in ${template}`);
        }
      } else {
        console.log(`⚠️ Already injected in ${template}`);
      }
    } catch (err) {
      console.log(`⚠️ Skipping ${template} - ${err.message}`);
    }
  }
}

run();
