const fs = require('fs');
const path = require('path');

const srcFile = 'c:\\Users\\anedo\\Desktop\\CursorProject\\uglywebsites\\exports\\emergency-rv-page-build-FULL.md';
const targetDir = 'c:\\Users\\anedo\\Desktop\\HVAC\\HVACRevenueBoostWeb';

if (!fs.existsSync(srcFile)) {
  console.error("Source file not found at", srcFile);
  process.exit(1);
}

const content = fs.readFileSync(srcFile, 'utf8');

// Regex to match:
// ## `filepath`
// 
// ~~~lang
// (content)
// ~~~
const regex = /##\s+`(.*?)`\s*[\r\n]+~~~.*?\r?\n([\s\S]*?)\r?\n~~~/g;

let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  let filepath = match[1];
  const fileContent = match[2];
  
  // Clean up path (sometimes it might have extra spaces)
  filepath = filepath.trim();
  
  // Convert Unix paths to Windows paths
  const fullPath = path.join(targetDir, filepath);
  const dirName = path.dirname(fullPath);
  
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, fileContent, 'utf8');
  console.log(`Wrote: ${filepath}`);
  count++;
}

console.log(`Finished extracting ${count} files.`);
