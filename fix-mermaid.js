const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'components', 'MermaidRenderer.tsx');
let content = fs.readFileSync(filepath, 'utf-8');

// Fix the backticks and syntax escapes
content = content.replace(/\\\`/g, '\`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(filepath, content);
console.log('Fixed syntax escapes in MermaidRenderer.tsx');
